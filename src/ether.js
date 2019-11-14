import React, { useMemo, useEffect, useState } from "react";
import Web3 from "web3";
import Portis from "@portis/web3";
import { PiggyBankABI, TokenABI } from "./contracts";

export const addresses = {
  main: "0x08f6e0571bcda646d11371c0dab7d9a72be6bb8e",
  ropsten: "0x1B723eD1Ea1D145444c4Bab8fbd4f8FF886bFFa3"
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

    return { address, name, owner, balance, contract };
  } catch (err) {
    return {};
  }
};

export const useBanks = (web3, piggyBanks) => {
  const [events, setEvents] = useState([]);
  const addEvent = e => setEvents(events => [...events, e]);

  useEffect(() => {
    if (!piggyBanks) return;
    const event = piggyBanks.events.Created();
    event.on("data", addEvent);
    return () => event.off("data", addEvent);
  }, [piggyBanks]);

  const refresh = async () => {
    const o = { fromBlock: 0, toBlock: "latest" };
    setEvents(await piggyBanks.getPastEvents("Created", o));
  };

  useEffect(() => {
    if (!piggyBanks) return;
    refresh();
  }, [piggyBanks]);

  const [banks, setBanks] = useState([]);

  const getBanks = async () => {
    const banks = [];
    for await (const e of events) {
      const { piggyBank } = e.returnValues;
      const bank = await getPiggyBank(web3, piggyBank);
      if (!bank.contract) continue;
      const { allEvents } = bank.contract.events;
      allEvents().on("data", getBanks);
      banks.push(bank);
    }
    setBanks(banks);
  };

  useEffect(() => {
    getBanks();
  }, [events]);

  return banks;
};

export const getToken = async (web3, data, address) => {
  try {
    const contract = getContract(web3, TokenABI, address);
    const name = await contract.methods.name().call();
    const symbol = await contract.methods.symbol().call();
    const balance = await contract.methods.balanceOf(data.address).call();
    return { address, name, symbol, balance, contract };
  } catch (err) {
    return { address };
  }
};
