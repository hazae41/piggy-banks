import React, { useMemo, useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";

import "./styles.css";

import QRCode from "qrcode.react";
import { Helmet } from "react-helmet";
import { useTheme } from "@material-ui/styles";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Card,
  CardContent,
  InputBase,
  Toolbar,
  InputAdornment,
  Button,
  IconButton,
  CardActionArea,
  Divider,
  AppBar,
  Dialog,
  CardHeader,
  DialogContent,
  CircularProgress,
  ListItemText,
  Typography,
  ListItem,
  Switch
} from "@material-ui/core";
import {
  SearchOutlined,
  AddOutlined,
  CodeOutlined,
  CloseOutlined,
  PeopleOutlined,
  VpnKeyOutlined,
  FileCopyOutlined,
  EditOutlined,
  ShareOutlined,
  AddCircle,
  LockOpenOutlined,
  HelpOutlined,
  MonetizationOnOutlined
} from "@material-ui/icons";
import {
  useWeb3,
  addresses,
  useContract,
  useBanks,
  getPiggyBank,
  getToken,
  useAccount,
  useNetwork
} from "./ether";
import { PiggyBanksABI, TokenABI } from "./contracts";
import { help } from "./help";
import copy from "clipboard-copy";
import FuzzySearch from "fuzzy-search";
import { Router, navigate } from "@reach/router";
import {
  piggyDark,
  BoldTypography,
  Touchtip,
  piggyLight,
  bold,
  ellipsis
} from "./styles";
import * as  serviceWorker from "./serviceWorker";
import Markdown from "react-markdown";

const Head = () => {
  const { primary } = useTheme().palette;
  return (
    <Helmet>
      <title children={"Piggy Banks"} />
      <body style={`background: ${primary.main};`} />
      <meta name="theme-color" content={primary.main} />
    </Helmet>
  );
};

const notify = async (title, options) => {
  if (Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.getRegistration();
  reg.showNotification(title, { icon: "/icon.png", ...options });
};

const App = () => {
  Notification.requestPermission();

  const web3 = useWeb3();

  const network = useNetwork(web3);
  const address = useMemo(() => addresses[network], [network]);
  const piggyBanks = useContract(web3, PiggyBanksABI, address);
  const banks = useBanks(web3, piggyBanks);

  const openAddress = address => isAddress(address) && navigate(address);

  const [account, updateAccount, loading] = useAccount(web3);
  const [onlyOwned, setOnlyOwned] = useState(false);

  useEffect(() => {
    if (!account) return;
    setOnlyOwned(true);
  }, [account]);

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const keys = ["address", "name", "owner"];
    let all = [...banks].reverse();
    if (onlyOwned) all = all.filter(({ owner }) => owner === account);
    const searcher = new FuzzySearch(all, keys, { sort: true });
    return searcher.search(search);
  }, [account, banks, search, onlyOwned]);

  const app = { account, network, web3, piggyBanks };

  const { fromWei, isAddress } = web3.utils;
  const goto = path => () => navigate(path);

  return (
    <ThemeProvider theme={piggyDark}>
      <Head />
      <CssBaseline />

      <ThemeProvider theme={piggyLight}>
        <Router>
          <HelpDialog path="help" />
          <CreateDialog app={app} path="create" />
          <BankDialog app={app} path=":address/*" />
        </Router>
      </ThemeProvider>

      <AppBar elevation={0} position="fixed" style={{ top: "auto", bottom: 0 }}>
        <Toolbar>
          <Box flex={1} />
          <Touchtip title="Help">
            <IconButton onClick={goto("help")} children={<HelpOutlined />} />
          </Touchtip>
          <Touchtip title="Source code">
            <IconButton
              component="a"
              target="_blank"
              href="https://github.com/hazae41/piggy-banks/"
              children={<CodeOutlined />}
            />
          </Touchtip>
        </Toolbar>
      </AppBar>

      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        minHeight="90vh"
      >
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center">
            <img alt="icon" style={{ height: "5em" }} src="/icon.png" />
            <Box width={16} />
            <Box display="flex">
              <BoldTypography variant="h3" children="Piggy Banks" />
              {network && network !== "main" && (
                <BoldTypography variant="overline" children={network} />
              )}
            </Box>
          </Box>
          <Box height={16} />
          <Box maxWidth={500} m="auto">
            <ThemeProvider theme={piggyLight}>
              <Card elevation={0}>
                <Toolbar>
                  <InputBase
                    fullWidth
                    style={bold}
                    placeholder="Search for a piggy bank"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyPress={e =>
                      e.key === "Enter" && openAddress(e.target.value)
                    }
                    startAdornment={
                      <InputAdornment
                        position="start"
                        children={<SearchOutlined />}
                      />
                    }
                  />
                  {!account && !loading && (
                    <Touchtip title="Connect">
                      <IconButton
                        color="primary"
                        onClick={updateAccount}
                        children={<LockOpenOutlined />}
                      />
                    </Touchtip>
                  )}
                  {!account && loading && (
                    <CircularProgress color="primary" size={24} />
                  )}
                  {account && (
                    <>
                      <Touchtip title="Create">
                        <span>
                          <IconButton
                            disabled={!piggyBanks}
                            color="primary"
                            onClick={goto("create")}
                            children={<AddCircle />}
                          />
                        </span>
                      </Touchtip>
                    </>
                  )}
                </Toolbar>
              </Card>
              <Box height={16} />
              <Card elevation={0}>
                <Toolbar>
                  <BoldTypography
                    variant="h6"
                    children={(onlyOwned ? "My" : "All") + " piggy banks"}
                  />
                  <Box flex={1} />
                  {account && (
                    <Touchtip title="Only mine">
                      <Switch
                        color="primary"
                        checked={onlyOwned}
                        onChange={() => setOnlyOwned(!onlyOwned)}
                      />
                    </Touchtip>
                  )}
                </Toolbar>
                <Divider />
                <Box maxHeight="40vh" style={{ overflowY: "auto" }}>
                  {filtered.map(({ address, name, balance }) => (
                    <CardActionArea
                      key={address}
                      onClick={() => navigate(address)}
                    >
                      <Toolbar>
                        <ListItemText
                          style={ellipsis}
                          primary={name}
                          secondary={address}
                          secondaryTypographyProps={{ style: ellipsis }}
                        />
                      </Toolbar>
                      <Divider />
                    </CardActionArea>
                  ))}
                </Box>
              </Card>
            </ThemeProvider>
          </Box>
        </CardContent>
      </Box>
    </ThemeProvider>
  );
};

const HelpDialog = ({ navigate }) => {
  const close = () => navigate("..");
  return (
    <Dialog fullWidth disableEnforceFocus scroll="body" open onClose={close}>
      <CardHeader
        title="Piggy Banks 🐷"
        titleTypographyProps={{ style: bold }}
        action={<IconButton onClick={close} children={<CloseOutlined />} />}
      />
      <CardContent>
        <Box marginTop={-4} />
        <Markdown source={help} />
      </CardContent>
    </Dialog>
  );
};

const BankDialog = ({ app, address, navigate }) => {
  const close = () => navigate("..");
  const { web3, account, network } = app;
  const { toWei } = web3.utils;

  const [data, setData] = useState({});

  const update = useCallback(() => {
    getPiggyBank(web3, address).then(setData);
  }, [address, network]);

  useEffect(() => {
    update();
  }, [update]);

  const { name, owner, contract } = data;
  const [status, setStatus] = useState();

  useEffect(() => {
    if (!contract) return;
    const events = contract.events.allEvents();
    events.on("data", update);
    return () => events.off("data", update);
  }, [update, contract]);

  const view = () => {
    const prefix = network !== "main" ? network + "." : "";
    window.open(`https://${prefix}etherscan.io/address/` + address, "_blank");
  };

  const share = () => {
    navigator.share({
      title: name,
      text: `"${name}" - ${address}`,
      url: window.location.href
    });
  };

  const free = async () => {
    try {
      setStatus("loading");
      await contract.methods
        .free()
        .send({ from: account, gasPrice: toWei("1", "gwei") });
      notify("Freed!", {
        body: `"${data.name}" has successfully been freed 🐷`
      });
      close();
    } catch (err) {
      setStatus();
    }
  };

  const goto = path => () => navigate(path);

  return !contract ? null : (
    <Dialog fullWidth disableEnforceFocus scroll="body" open onClose={close}>
      <Helmet>
        <title children={`${name} - ${address}`} />
      </Helmet>

      <Router>
        <TransferDialog path="transfer" app={app} data={data} />
        <RenameDialog path="rename" app={app} data={data} />
      </Router>

      <CardHeader
        title={name}
        titleTypographyProps={{ style: bold }}
        subheader={address}
        subheaderTypographyProps={{ style: ellipsis }}
        action={<IconButton onClick={close} children={<CloseOutlined />} />}
      />
      <DialogContent>
        <Box display="flex" justifyContent="center">
          <QRCode
            value={"ethereum:" + address}
            size={1024}
            style={{
              width: "90%",
              maxWidth: 256,
              height: "90%",
              maxHeight: 256
            }}
          />
        </Box>
        <Box height={16} />
        <TokensAndCollectibles app={app} data={data} />
        <Box height={16} />
      </DialogContent>
      <Divider />
      <Toolbar
        disableGutters
        style={{ flexWrap: "wrap", justifyContent: "space-evenly" }}
      >
        <Touchtip title="Copy address">
          <IconButton
            onClick={() => copy(address)}
            children={<FileCopyOutlined />}
          />
        </Touchtip>
        {navigator.share && (
          <Touchtip title="Share">
            <IconButton onClick={share} children={<ShareOutlined />} />
          </Touchtip>
        )}
        <Touchtip title="View on Etherscan">
          <IconButton onClick={view} children={<SearchOutlined />} />
        </Touchtip>
        {owner === account && (
          <>
            <Touchtip title="Rename">
              <IconButton
                onClick={goto("rename")}
                children={<EditOutlined />}
              />
            </Touchtip>
            <Touchtip title="Free">
              <IconButton onClick={free} children={<VpnKeyOutlined />} />
            </Touchtip>
            <Touchtip title="Transfer">
              <IconButton
                onClick={goto("transfer")}
                children={<PeopleOutlined />}
              />
            </Touchtip>
          </>
        )}
      </Toolbar>
      {status && (
        <Toolbar style={{ justifyContent: "center" }}>
          {status === "loading" && <CircularProgress color="primary" />}
        </Toolbar>
      )}
    </Dialog>
  );
};

const TokensAndCollectibles = ({ app, data }) => {
  const { web3, account, network } = app;
  const { isAddress, toWei, fromWei } = web3.utils;
  const { contract } = data;

  const [tokens, setTokens] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [input, setInput] = useState("");
  const valid = useMemo(() => isAddress(input), [input]);
  const [status, setStatus] = useState();

  const ether = {
    name: "Ether",
    symbol: "Ξ",
    address: `Ethers on the ${network} network`,
    balance: fromWei(data.balance, "ether")
  };

  const getTokens = async () => {
    const result = [];
    const { tokens, tokensCount } = contract.methods;
    const count = await tokensCount().call();
    for (let i = 0; i < count; i++) {
      const address = await tokens(i).call();
      result.push(await getToken(web3, data, address));
    }
    return result;
  };

  const getCollectibles = async () => {
    const result = [];
    const { collectibles, collectiblesCount } = contract.methods;
    const { collected, collectedCount } = contract.methods;
    const ncollectibles = await collectiblesCount().call();
    for (let i = 0; i < ncollectibles; i++) {
      const address = await collectibles(i).call();
      const token = await getToken(web3, data, address);
      const tokens = [];
      const ncollected = await collectedCount(address).call();
      for (let j = 0; j < ncollected; j++) {
        tokens.push(await collected(address, j).call());
      }
      result.push({ ...token, tokens });
    }
    return result;
  };

  useEffect(() => {
    if (status === "loading") return;
    getTokens().then(setTokens);
    getCollectibles().then(setCollectibles);
  }, [status]);

  const addToken = async () => {
    if (!valid) return;
    try {
      setStatus("loading");
      const { name, symbol } = await getToken(web3, data, input);
      if (!name) throw new Error("This address is not a token");
      await contract.methods
        .addToken(input)
        .send({ from: account, gasPrice: toWei("1", "gwei") });
      setInput("");
      setStatus();
      notify("Token added!", {
        body: `Token ${symbol} has been added to ${data.name}`
      });
    } catch ({ message }) {
      setStatus(message);
    }
  };

  return (
    <>
      <Toolbar disableGutters>
        <BoldTypography variant="h6" children="Tokens" />
      </Toolbar>
      {[ether, ...tokens].map(
        ({ address, name, symbol, balance }) =>
          name && (
            <Card elevation={0} style={{ marginBottom: 8 }}>
              <Box bgcolor="secondary.main">
                <ListItem style={{ flexWrap: "wrap" }}>
                  <ListItemText
                    primary={`${name} (${symbol})`}
                    secondary={address}
                    secondaryTypographyProps={{ style: ellipsis }}
                  />
                  <Typography children={balance} />
                </ListItem>
              </Box>
            </Card>
          )
      )}
      <Card elevation={0}>
        <Box bgcolor="secondary.main">
          <Toolbar>
            <InputBase
              style={bold}
              fullWidth
              placeholder="Token address"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === "Enter" && addToken()}
            />
            <Touchtip title="Add token">
              <span>
                <IconButton
                  disabled={!valid || !account}
                  onClick={addToken}
                  children={<AddOutlined />}
                />
              </span>
            </Touchtip>
          </Toolbar>
        </Box>
      </Card>
      {status && (
        <Toolbar style={{ justifyContent: "center" }}>
          {status !== "loading" && (
            <Typography color="error" children={status} />
          )}
          {status === "loading" && <CircularProgress color="primary" />}
        </Toolbar>
      )}
      {!!collectibles.length && (
        <Toolbar disableGutters>
          <BoldTypography variant="h6" children="Collectibles" />
        </Toolbar>
      )}
      {collectibles.map(({ name, address, tokens }) => (
        <Card elevation={0} style={{ marginBottom: 8 }}>
          <Box bgcolor="secondary.main">
            <ListItem style={{ flexWrap: "wrap" }}>
              <ListItemText
                primary={name || "Some collectibles"}
                secondary={address}
                secondaryTypographyProps={{ style: ellipsis }}
              />
            </ListItem>
            {tokens.map(id => (
              <ListItem style={{ paddingLeft: 32 }}>
                <ListItemText primary={"Collectible " + id} />
              </ListItem>
            ))}
          </Box>
        </Card>
      ))}
    </>
  );
};

const TransferDialog = ({ app, data, navigate }) => {
  const close = () => navigate("..");

  const { web3, account } = app;
  const { isAddress, toWei } = web3.utils;
  const { name, owner, contract } = data;

  const [to, setTo] = useState("");
  const [status, setStatus] = useState();

  const transfer = async () => {
    try {
      setStatus("loading");
      await contract.methods
        .transfer(to)
        .send({ from: account, gasPrice: toWei("1", "gwei") });
      notify("Transfered!", {
        body: `"${data.name}" has successfully been transfered 🐷`
      });
      close();
    } catch (err) {
      setStatus();
    }
  };

  return account !== owner ? null : (
    <Dialog disableEnforceFocus fullWidth scroll="body" open onClose={close}>
      <CardHeader
        title={`Transfer "${name}"`}
        titleTypographyProps={{ style: bold }}
        action={<IconButton onClick={close} children={<CloseOutlined />} />}
      />
      <DialogContent>
        <Card elevation={0}>
          <Box bgcolor="secondary.main">
            <Toolbar>
              <InputBase
                style={bold}
                fullWidth
                placeholder="New owner"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </Toolbar>
          </Box>
        </Card>
        <Toolbar disableGutters style={{ justifyContent: "center" }}>
          {status === "loading" && <CircularProgress color="primary" />}
          {!status && (
            <Button
              disabled={!to || to === account || !isAddress(to)}
              onClick={transfer}
              color="primary"
              fullWidth
              style={{ ...bold, boxShadow: "none" }}
              variant="contained"
              children="Transfer"
              startIcon={<PeopleOutlined />}
            />
          )}
        </Toolbar>
      </DialogContent>
    </Dialog>
  );
};

const RenameDialog = ({ app, data, navigate }) => {
  const close = () => navigate("..");

  const { web3, account } = app;
  const { fromUtf8, toWei } = web3.utils;
  const { name: oldName, owner, contract } = data;

  const [name, setName] = useState(oldName);
  const [status, setStatus] = useState();

  const valid = useMemo(() => fromUtf8(name).length <= 66, [name]);

  const rename = async () => {
    try {
      setStatus("loading");
      await contract.methods
        .rename(fromUtf8(name))
        .send({ from: account, gasPrice: toWei("1", "gwei") });
      notify("Renamed!", {
        body: `"${data.name}" has successfully been renamed 🐷`
      });
      close();
    } catch (err) {
      setStatus();
    }
  };

  return account !== owner ? null : (
    <Dialog disableEnforceFocus fullWidth scroll="body" open onClose={close}>
      <CardHeader
        title={`Rename "${oldName}"`}
        titleTypographyProps={{ style: bold }}
        action={<IconButton onClick={close} children={<CloseOutlined />} />}
      />
      <DialogContent>
        <Card elevation={0}>
          <Box bgcolor="secondary.main">
            <Toolbar>
              <InputBase
                style={bold}
                fullWidth
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Toolbar>
          </Box>
        </Card>
        {!valid && (
          <Box marginTop={1}>
            <Typography color="error" children="This name is too long" />
          </Box>
        )}
        <Toolbar disableGutters style={{ justifyContent: "center" }}>
          {status === "loading" && <CircularProgress color="primary" />}
          {!status && (
            <Button
              disabled={!name || !valid || name === oldName}
              onClick={rename}
              color="primary"
              fullWidth
              style={{ ...bold, boxShadow: "none" }}
              variant="contained"
              children="Rename"
              startIcon={<EditOutlined />}
            />
          )}
        </Toolbar>
      </DialogContent>
    </Dialog>
  );
};

const CreateDialog = ({ app, navigate }) => {
  const close = () => navigate("..");
  const { web3, account, piggyBanks } = app;
  const { fromWei, fromUtf8, toWei } = web3.utils;

  const [name, setName] = useState("My piggy bank 🐷");
  const [price, setPrice] = useState();
  const [status, setStatus] = useState();

  const valid = useMemo(() => fromUtf8(name).length <= 66, [name]);

  useEffect(() => {
    if (!piggyBanks) return;
    piggyBanks.methods
      .price()
      .call()
      .then(setPrice);
  }, [piggyBanks]);

  const create = async () => {
    try {
      setStatus("loading");
      await piggyBanks.methods
        .create(fromUtf8(name))
        .send({ from: account, value: price, gasPrice: toWei("1", "gwei") });
      notify("Created!", {
        body: `"${name}" has successfully been created 🐷`
      });
      close();
    } catch (err) {
      console.log(err);
      setStatus();
    }
  };

  return (
    <Dialog disableEnforceFocus fullWidth scroll="body" open onClose={close}>
      <CardHeader
        title="Create a new piggy bank"
        titleTypographyProps={{ style: bold }}
        action={<IconButton onClick={close} children={<CloseOutlined />} />}
        subheader={price && fromWei(price, "finney") + "mΞ + gas fees"}
      />
      <DialogContent>
        <Card elevation={0}>
          <Box bgcolor="secondary.main">
            <Toolbar>
              <InputBase
                style={bold}
                fullWidth
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Toolbar>
          </Box>
        </Card>
        {!valid && (
          <Box marginTop={1}>
            <Typography color="error" children="This name is too long" />
          </Box>
        )}
        <Toolbar disableGutters style={{ justifyContent: "center" }}>
          {status === "loading" && <CircularProgress color="primary" />}
          {!status && (
            <Button
              disabled={!name || !valid || !price}
              onClick={create}
              color="primary"
              fullWidth
              style={{ ...bold, boxShadow: "none" }}
              variant="contained"
              children="Create"
              startIcon={<AddOutlined />}
            />
          )}
        </Toolbar>
      </DialogContent>
    </Dialog>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

serviceWorker.register();
