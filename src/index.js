import {
  AppBar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  CssBaseline,
  Divider,
  IconButton,
  InputAdornment,
  InputBase,
  ListItemText,
  Switch,
  ThemeProvider,
  Toolbar,
  Snackbar,
  Button,
  Typography
} from "@material-ui/core";
import {
  AddCircle,
  CodeOutlined,
  HelpOutlined,
  LockOpenOutlined,
  SearchOutlined,
  SettingsOutlined,
  CloseOutlined,
  RefreshOutlined
} from "@material-ui/icons";
import { useTheme } from "@material-ui/styles";
import { navigate, Router } from "@reach/router";
import FuzzySearch from "fuzzy-search";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { Helmet } from "react-helmet";
import { BankDialog } from "./bank";
import { PiggyBanksABI } from "./contracts";
import { CreateDialog } from "./create";
import {
  addresses,
  useAccount,
  useBanks,
  useContract,
  useNetwork,
  useWeb3
} from "./ether";
import { HelpDialog } from "./help";
import * as serviceWorker from "./serviceWorker";
import {
  bold,
  BoldTypography,
  ellipsis,
  piggyDark,
  piggyLight,
  Touchtip
} from "./styles";
import { useLang } from "./lang";
import { SettingsDialog } from "./settings";

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

export const useLocalStorage = (key, def) => {
  const { parse, stringify } = JSON;
  const [raw, setRaw] = useState(localStorage[key]);
  const value = useMemo(() => parse(raw || null) || def, [raw, def]);
  const setValue = useCallback(it => setRaw(stringify(it)), []);

  useEffect(() => {
    localStorage[key] = raw || null;
  }, [raw]);

  return [value, setValue];
};

const defLang = navigator.languages ? navigator.languages[0] : "en";
const defSettings = { lang: defLang, gasPrice: 1000000000 };

const App = () => {
  const [settings, setSettings] = useLocalStorage("settings", defSettings);
  const lang = useLang(settings.lang);

  const web3 = useWeb3();

  const network = useNetwork(web3);
  const [account, connect, isConnecting] = useAccount(web3);

  const address = useMemo(() => addresses[network], [network]);
  const PiggyBanks = useContract(web3, PiggyBanksABI, address);

  useEffect(() => {
    if (!account) return;
    try {
      Notification.requestPermission();
    } catch (err) {}
  }, [account]);

  const [search, setSearch] = useState("");

  const app = { settings, lang, account, network, web3, PiggyBanks };

  const banks = useBanks(app, PiggyBanks);

  return (
    <ThemeProvider theme={piggyDark}>
      <Head />
      <CssBaseline />
      <Updater app={app} />

      <ThemeProvider theme={piggyLight}>
        <Router>
          <SettingsDialog app={app} setSettings={setSettings} path="settings" />
          <HelpDialog path="help" />
          <CreateDialog app={app} path="create" />
          <BankDialog app={app} banks={banks} path=":address/*" />
        </Router>
      </ThemeProvider>

      <AppBar elevation={0} position="fixed" style={{ top: "auto", bottom: 0 }}>
        <Toolbar>
          <Box flex={1} />
          <Touchtip title={lang.bottom.source}>
            <IconButton
              component="a"
              target="_blank"
              href="https://github.com/hazae41/piggy-banks/"
              children={<CodeOutlined />}
            />
          </Touchtip>
          <Touchtip title={lang.bottom.help}>
            <IconButton
              onClick={() => navigate("help")}
              children={<HelpOutlined />}
            />
          </Touchtip>
          <Touchtip title={lang.bottom.settings}>
            <IconButton
              onClick={() => navigate("settings")}
              children={<SettingsOutlined />}
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
              <SearchBar
                app={app}
                search={[search, setSearch]}
                connect={[connect, isConnecting]}
              />
              <Box height={16} />
              <BanksList app={app} search={search} banks={banks} />
            </ThemeProvider>
          </Box>
        </CardContent>
      </Box>
    </ThemeProvider>
  );
};

const SearchBar = ({
  app,
  search: [search, setSearch],
  connect: [connect, isConnecting]
}) => {
  const { lang, account, web3, PiggyBanks } = app;
  const { isAddress } = web3.utils;
  const open = address => isAddress(address) && navigate(address);

  return (
    <Card elevation={0}>
      <Toolbar>
        <InputBase
          fullWidth
          style={bold}
          placeholder={lang.search.placeholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyPress={e => e.key === "Enter" && open(e.target.value)}
          startAdornment={
            <InputAdornment position="start" children={<SearchOutlined />} />
          }
        />
        {!account && !isConnecting && (
          <Touchtip title={lang.search.connect}>
            <IconButton
              color="primary"
              onClick={connect}
              children={<LockOpenOutlined />}
            />
          </Touchtip>
        )}
        {!account && isConnecting && (
          <CircularProgress color="primary" size={24} />
        )}
        {account && (
          <>
            <Touchtip title={lang.search.create}>
              <span>
                <IconButton
                  disabled={!PiggyBanks}
                  color="primary"
                  onClick={() => navigate("create")}
                  children={<AddCircle />}
                />
              </span>
            </Touchtip>
          </>
        )}
      </Toolbar>
    </Card>
  );
};

const BanksList = ({ app, search, banks }) => {
  const { lang, account } = app;
  const [onlyOwned, setOnlyOwned] = useState(false);

  const filtered = useMemo(() => {
    const keys = ["address", "name", "owner"];
    let all = [...banks].reverse();
    if (onlyOwned) all = all.filter(({ owner }) => owner === account);
    const searcher = new FuzzySearch(all, keys, { sort: true });
    return searcher.search(search);
  }, [account, banks, search, onlyOwned]);

  useEffect(() => {
    if (!account) return;
    setOnlyOwned(true);
  }, [account]);

  return (
    <Card elevation={0}>
      <Toolbar>
        <BoldTypography
          variant="h6"
          children={onlyOwned ? lang.list.mine : lang.list.all}
        />
        <Box flex={1} />
        {account && (
          <Touchtip title={lang.list.onlyMine}>
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
        {filtered.map(({ address, name }) => (
          <CardActionArea key={address} onClick={() => navigate(address)}>
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
  );
};

const Updater = ({ app }) => {
  const { lang } = app;
  const [reg, setReg] = useState();
  const close = () => setReg();

  const update = () => {
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => window.location.reload(), 1000);
  };

  useEffect(() => {
    serviceWorker.register({ onUpdate: setReg });
    return () => serviceWorker.unregister();
  }, []);

  const [reload, message] = lang.notif.update;
  const anchor = { vertical: "bottom", horizontal: "left" };

  const action = (
    <>
      <Touchtip title={reload}>
        <IconButton
          color="primary"
          onClick={update}
          children={<RefreshOutlined />}
        />
      </Touchtip>
      <Box width={8} />
      <IconButton
        color="primary"
        onClick={close}
        children={<CloseOutlined />}
      />
    </>
  );

  return (
    <Snackbar
      open={Boolean(reg)}
      onClose={close}
      anchorOrigin={anchor}
      message={<Typography style={bold} children={message} />}
      action={action}
    />
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
