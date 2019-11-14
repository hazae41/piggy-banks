import React, { useMemo, useEffect, useState } from "react";
import Web3 from "web3";
import Portis from "@portis/web3";
import { PiggyBankABI, TokenABI } from "./contracts";
import { notify } from "./serviceWorker";

export const addresses = {
  main: "0x2dc217377ae86268d1f5075fd0a9ad2649617a3c",
  ropsten: "0xa0270dd8c96ec2cc5f8f9740f6c9cbda7634459b"
};

export const useWeb3 = () => {
  return useMemo(() => {
    const portis = new Portis(
      "6251b679-7258-4e0e-b0b4-a62fe1b915d6",
      "mainnet"
    );
    return new Web3(window.ethereum || portis.provider);
  }, []);
};

export const useNetwork = web3 => {
  const { getNetworkType } = web3.eth.net;
  const [network, setNetwork] = useState();
  const updateNetwork = () => getNetworkType().then(setNetwork);

  useEffect(() => {
    if (network) return;
    const i = setInterval(updateNetwork, 100);
    return () => clearInterval(i);
  }, [network]);

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.autoRefreshOnNetworkChange = false;
    window.ethereum.on("networkChanged", updateNetwork);
    return () => window.ethereum.off("networkChanged", updateNetwork);
  }, []);

  return network;
};

export const getAccount = async web3 => {
  if (window.ethereum) await window.ethereum.enable();
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
};

export const useAccount = web3 => {
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState();

  const update = async () => {
    setLoading(true);
    try {
      setAccount(await getAccount(web3));
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    if (!account || !window.ethereum) return;
    window.ethereum.on("accountsChanged", update);
    return () => window.ethereum.off("accountsChanged", update);
  }, [account]);

  return [account, update, loading];
};

export const getContract = (web3, ABI, address) => {
  if (!ABI || !address) return;
  const { Contract } = web3.eth;
  return new Contract(ABI, address);
};

export const useContract = (web3, ABI, address) => {
  return useMemo(() => getContract(web3, ABI, address), [web3, ABI, address]);
};

export const getPiggyBank = async (web3, address) => {
  try {
    const { Contract, getBalance } = web3.eth;
    const { toUtf8 } = web3.utils;

    const contract = new Contract(PiggyBankABI, address);
    const balance = await getBalance(address);
    const owner = await contract.methods.owner().call();
    const name = toUtf8(await contract.methods.name().call());
    const tokens = await getTokens(web3, { address, contract });
    const collectibles = await getCollectibles(web3, { address, contract });

    return { address, name, owner, balance, contract, tokens, collectibles };
  } catch (err) {
    return {};
  }
};

export const useBanks = (web3, account, PiggyBanks) => {
  const [events, setEvents] = useState([]);
  const addEvent = e => setEvents(events => [...events, e]);

  useEffect(() => {
    if (!PiggyBanks) return;
    const event = PiggyBanks.events.Created();
    event.on("data", addEvent);
    return () => event.off("data", addEvent);
  }, [PiggyBanks]);

  const refresh = async () => {
    const o = { fromBlock: 0, toBlock: "latest" };
    setEvents(await PiggyBanks.getPastEvents("Created", o));
  };

  useEffect(() => {
    if (!PiggyBanks) return;
    refresh();
  }, [PiggyBanks]);

  const [eventsToBanks, setEventsToBanks] = useState({});

  const getBank = async e => {
    const { piggyBank } = e.returnValues;
    const bank = await getPiggyBank(web3, piggyBank);
    return bank.contract && bank;
  };

  const refreshBank = async e => {
    const bank = await getBank(e);
    setEventsToBanks(eventsToBanks => {
      eventsToBanks[e] = bank;
      return { ...eventsToBanks };
    });
  };

  const listenEvents = (e, bank) => {
    if (!bank) return;
    const { allEvents, Received } = bank.contract.events;
    allEvents().on("data", () => refreshBank(e));

    Received().on("data", e => {
      const { owner } = bank;
      if (owner !== account) return;
      const { fromWei } = web3.utils;
      const { sender, value } = e.returnValues;
      const ethers = fromWei(value, "ether");
      const body = `${bank.name} received ${ethers} from ${sender}`;
      notify("Received some ethers!", { body });
    });
  };

  const getBanks = async () => {
    const eventsToBanks = {};
    for await (const e of events) {
      const bank = await getBank(e);
      eventsToBanks[e] = bank;
      listenEvents(e, bank);
    }
    return eventsToBanks;
  };

  useEffect(() => {
    getBanks().then(setEventsToBanks);
  }, [events, account]);

  const banks = useMemo(() => {
    return events.map(e => eventsToBanks[e]).filter(it => it);
  }, [events, eventsToBanks]);

  return banks;
};

export const getToken = async (web3, bank, address) => {
  try {
    const contract = getContract(web3, TokenABI, address);
    const name = await contract.methods.name().call();
    const symbol = await contract.methods.symbol().call();
    const balance = await contract.methods.balanceOf(bank.address).call();
    return { address, name, symbol, balance, contract };
  } catch (err) {
    return { address };
  }
};

export const getTokens = async (web3, bank) => {
  const result = [];
  const { tokens, tokensCount } = bank.contract.methods;
  const count = await tokensCount().call();
  for (let i = 0; i < count; i++) {
    const address = await tokens(i).call();
    const token = await getToken(web3, bank, address);
    result.push(token);
  }
  return result;
};

export const getCollectibles = async (web3, bank) => {
  const result = [];
  const { collectibles, collectiblesCount } = bank.contract.methods;
  const { collected, collectedCount } = bank.contract.methods;
  const ncollectibles = await collectiblesCount().call();
  for (let i = 0; i < ncollectibles; i++) {
    const address = await collectibles(i).call();
    const token = await getToken(web3, bank, address);
    const tokens = [];
    const ncollected = await collectedCount(address).call();
    for (let j = 0; j < ncollected; j++) {
      const collectible = await collected(address, j).call();
      tokens.push(collectible);
    }
    result.push({ ...token, tokens });
  }
  return result;
};
