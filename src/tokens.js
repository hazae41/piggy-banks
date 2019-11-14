import React, { useState, useMemo, useEffect } from "react";
import { getToken, getTokens, getCollectibles } from "./ether";
import { notify } from "./serviceWorker";
import {
  Toolbar,
  Card,
  Box,
  ListItem,
  ListItemText,
  Typography,
  InputBase,
  IconButton,
  CircularProgress
} from "@material-ui/core";
import { BoldTypography, ellipsis, bold, Touchtip } from "./styles";
import { AddOutlined } from "@material-ui/icons";

export const TokensAndCollectibles = ({ app, bank }) => (
  <>
    <Tokens app={app} bank={bank} />
    <Collectibles app={app} bank={bank} />
  </>
);

const Tokens = ({ app, bank }) => {
  const { account, network, web3 } = app;
  const { toWei, fromWei, isAddress } = web3.utils;
  const { contract, tokens } = bank;

  const [status, setStatus] = useState();

  const [input, setInput] = useState("");
  const valid = useMemo(() => isAddress(input), [input]);

  const addToken = async () => {
    setStatus("loading");
    try {
      if (!account) throw new Error("You must be connected to add a token");
      const { name, symbol } = await getToken(web3, bank, input);
      const notToken = `This address is not a token on the ${network} network`;
      if (!name) throw new Error(notToken);

      await contract.methods
        .addToken(input)
        .send({ from: account, gasPrice: toWei("1", "gwei") });

      const body = `Token ${symbol} has been added to ${bank.name}`;
      notify("Token added!", { body });

      setInput("");
      setStatus();
    } catch ({ message }) {
      setStatus(message);
    }
  };

  const ether = {
    name: "Ether",
    symbol: "Ξ",
    address: `Ethers on the ${network} network`,
    balance: fromWei(bank.balance, "ether")
  };

  return (
    <>
      <Toolbar disableGutters>
        <BoldTypography variant="h6" children="Tokens" />
      </Toolbar>
      {[ether, ...tokens].map(({ address, name, symbol, balance }) => (
        <Card key={address} elevation={0} style={{ marginBottom: 8 }}>
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
      ))}
      <Toolbar disableGutters>
        <BoldTypography variant="h6" children="Add a token" />
      </Toolbar>
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
            <Touchtip title="Add this token">
              <span>
                <IconButton
                  disabled={!valid}
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
    </>
  );
};

const Collectibles = ({ app, bank }) => {
  const { collectibles } = bank;

  return (
    <>
      {!!collectibles.length && (
        <Toolbar disableGutters>
          <BoldTypography variant="h6" children="Collectibles" />
        </Toolbar>
      )}
      {collectibles.map(({ name, address, tokens }) => (
        <Card key={address} elevation={0} style={{ marginBottom: 8 }}>
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
