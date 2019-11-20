import React, { useState, useCallback, useEffect, useMemo } from "react";
import { getPiggyBank } from "./ether";
import { notify } from "./serviceWorker";
import {
  Dialog,
  CardHeader,
  IconButton,
  DialogContent,
  Box,
  Divider,
  Toolbar,
  CircularProgress,
  CardContent,
  Chip,
  Typography,
  ListItem,
  Card,
  ListItemText
} from "@material-ui/core";
import { Helmet } from "react-helmet";
import { TransferDialog } from "./transfer";
import { RenameDialog } from "./rename";
import {
  CloseOutlined,
  FileCopyOutlined,
  ShareOutlined,
  SearchOutlined,
  EditOutlined,
  VpnKeyOutlined,
  PeopleOutlined,
  DoneOutlined
} from "@material-ui/icons";
import { bold, ellipsis, Touchtip } from "./styles";
import QRCode from "qrcode.react";
import { TokensAndCollectibles } from "./tokens";
import clipboard from "clipboard-copy";
import { Router } from "@reach/router";

export const BankDialog = ({ app, address, banks, navigate }) => {
  const close = () => navigate("..");

  const bank = useMemo(() => {
    if (!banks) return;
    return banks.find(it => it.address === address);
  }, [banks, address]);

  const { name, contract } = bank || {};

  if (!contract)
    return (
      <Dialog disableEnforceFocus open onClose={close}>
        <DialogContent>
          <Box width={60}>
            <CircularProgress color="primary" size={60} />
          </Box>
        </DialogContent>
      </Dialog>
    );

  return (
    <Dialog fullWidth disableEnforceFocus scroll="body" open onClose={close}>
      <Helmet>
        <title children={`${name} - ${address}`} />
      </Helmet>

      <Router>
        <TransferDialog path="transfer" app={app} bank={bank} />
        <RenameDialog path="rename" app={app} bank={bank} />
      </Router>

      <CardHeader
        title={name}
        titleTypographyProps={{ style: bold }}
        subheader={address}
        subheaderTypographyProps={{ style: ellipsis }}
        action={<IconButton onClick={close} children={<CloseOutlined />} />}
      />

      <BankInfobar app={app} bank={bank} />
      <Box height={16} />

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
        <Logs app={app} bank={bank} />
        <TokensAndCollectibles app={app} bank={bank} />
        <Box height={16} />
      </DialogContent>

      <Divider />
      <BankToolbar app={app} bank={bank} navigate={navigate} />
    </Dialog>
  );
};

const Logs = ({ app, bank }) => {
  const { lang, web3 } = app;
  const { fromWei } = web3.utils;
  const { logs, created, contract } = bank;

  return (
    <>
      <Toolbar disableGutters>
        <Typography style={bold} variant="h6" children={lang.logs.title} />
      </Toolbar>
      {[created, ...logs].reverse().map(({ event, address, returnValues }) => (
        <Card key={address} elevation={0} style={{ marginBottom: 8 }}>
          <Box bgcolor="secondary.main">
            <ListItem style={{ flexWrap: "wrap" }}>
              {event === "Created" && (
                <>
                  <ListItemText
                    primary={lang.logs.created}
                    secondary={returnValues.creator}
                    secondaryTypographyProps={{ style: ellipsis }}
                  />
                </>
              )}
              {event === "Received" && (
                <>
                  <ListItemText
                    primary={lang.logs.received}
                    secondary={returnValues.sender}
                    secondaryTypographyProps={{ style: ellipsis }}
                  />
                  <Typography children={fromWei(returnValues.value, "ether")} />
                </>
              )}
              {event === "Transferred" && (
                <>
                  <ListItemText
                    primary={lang.logs.transferred}
                    secondary={returnValues.owner}
                    secondaryTypographyProps={{ style: ellipsis }}
                  />
                </>
              )}
            </ListItem>
          </Box>
        </Card>
      ))}
    </>
  );
};

const BankInfobar = ({ app, bank }) => {
  const { lang, network } = app;
  const { address, name } = bank;

  const [copied, setCopied] = useState(false);

  const copy = () => {
    clipboard(address);
    setCopied(true);
  };

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(t);
  }, [copied]);

  const view = () => {
    const prefix = network !== "main" ? network + "." : "";
    window.open(
      `https://${prefix}etherscan.io/address/${address}`,
      "_blank",
      "noopener"
    );
  };

  // const share = () => {
  //   navigator.share({
  //     title: name,
  //     text: `"${name}" - ${address}`,
  //     url: window.location.href
  //   });
  // };

  return (
    <Toolbar
      style={{
        justifyContent: "center",
        flexWrap: "wrap",
        minHeight: "inherit"
      }}
    >
      <Chip
        clickable
        style={{ ...bold, margin: 4 }}
        label={lang.bank.copy}
        icon={copied ? <DoneOutlined /> : <FileCopyOutlined />}
        onClick={() => copy(address)}
      />
      <Chip
        clickable
        style={{ ...bold, margin: 4 }}
        label={lang.bank.view}
        icon={<SearchOutlined />}
        onClick={view}
      />
      {/* {navigator.share && (
        <Chip
          clickable
          style={{ ...bold, margin: 4 }}
          label={lang.bank.share}
          icon={<ShareOutlined />}
          onClick={share}
        />
      )} */}
    </Toolbar>
  );
};

const BankToolbar = ({ app, bank, navigate }) => {
  const close = () => navigate("..");
  const { settings, lang, account } = app;
  const { owner, contract } = bank;

  const [loading, setLoading] = useState(false);

  const free = async () => {
    setLoading(true);
    try {
      const { gasPrice } = settings;
      await contract.methods.free().send({ from: account, gasPrice });

      const body = lang.notif.freed;
      notify(bank.name, { body });

      close();
    } catch (err) {}
    setLoading(false);
  };

  return owner !== account ? null : (
    <>
      <Toolbar disableGutters style={{ justifyContent: "space-evenly" }}>
        <Touchtip title={lang.bank.rename}>
          <IconButton
            onClick={() => navigate("rename")}
            children={<EditOutlined />}
          />
        </Touchtip>
        <Touchtip title={lang.bank.free}>
          <IconButton onClick={free} children={<VpnKeyOutlined />} />
        </Touchtip>
        <Touchtip title={lang.bank.transfer}>
          <IconButton
            onClick={() => navigate("transfer")}
            children={<PeopleOutlined />}
          />
        </Touchtip>
      </Toolbar>
      {loading && (
        <Toolbar style={{ justifyContent: "center" }}>
          <CircularProgress color="primary" />
        </Toolbar>
      )}
    </>
  );
};
