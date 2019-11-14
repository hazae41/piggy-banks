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
  Toolbar
} from "@material-ui/core";
import {
  AddCircle,
  CodeOutlined,
  HelpOutlined,
  LockOpenOutlined,
  SearchOutlined
} from "@material-ui/icons";
import { useTheme } from "@material-ui/styles";
import { navigate, Router } from "@reach/router";
import FuzzySearch from "fuzzy-search";
import React, { useEffect, useMemo, useState } from "react";
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

const App = () => {
  const web3 = useWeb3();

  const network = useNetwork(web3);
  const [account, connect, isConnecting] = useAccount(web3);

  const address = useMemo(() => addresses[network], [network]);
  const PiggyBanks = useContract(web3, PiggyBanksABI, address);
  
  const banks = useBanks(web3, account, PiggyBanks);

  useEffect(() => {
    if (!account) return;
    Notification.requestPermission();
  }, [account]);

  const [search, setSearch] = useState("");

  const app = { account, network, web3, PiggyBanks };

  return (
    <ThemeProvider theme={piggyDark}>
      <Head />
      <CssBaseline />

      <ThemeProvider theme={piggyLight}>
        <Router>
          <HelpDialog path="help" />
          <CreateDialog app={app} path="create" />
          <BankDialog app={app} banks={banks} path=":address/*" />
        </Router>
      </ThemeProvider>

      <AppBar elevation={0} position="fixed" style={{ top: "auto", bottom: 0 }}>
        <Toolbar>
          <Box flex={1} />
          <Touchtip title="Help">
            <IconButton
              onClick={() => navigate("help")}
              children={<HelpOutlined />}
            />
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
  const { account, web3, PiggyBanks } = app;
  const { isAddress } = web3.utils;
  const open = address => isAddress(address) && navigate(address);

  return (
    <Card elevation={0}>
      <Toolbar>
        <InputBase
          fullWidth
          style={bold}
          placeholder="Search for a piggy bank"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyPress={e => e.key === "Enter" && open(e.target.value)}
          startAdornment={
            <InputAdornment position="start" children={<SearchOutlined />} />
          }
        />
        {!account && !isConnecting && (
          <Touchtip title="Connect">
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
            <Touchtip title="Create">
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
  const { account } = app;
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

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

serviceWorker.register();
