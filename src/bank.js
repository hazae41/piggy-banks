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
  CardContent
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
  PeopleOutlined
} from "@material-ui/icons";
import { bold, ellipsis, Touchtip } from "./styles";
import QRCode from "qrcode.react";
import { TokensAndCollectibles } from "./tokens";
import copy from "clipboard-copy";
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
        <TokensAndCollectibles app={app} bank={bank} />
        <Box height={16} />
      </DialogContent>
      <Divider />
      <BankToolbar app={app} bank={bank} navigate={navigate} />
    </Dialog>
  );
};

const BankToolbar = ({ app, bank, navigate }) => {
  const close = () => navigate("..");
  const { settings, lang, account, network } = app;
  const { address, name, owner, contract } = bank;

  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <Toolbar
        disableGutters
        style={{ flexWrap: "wrap", justifyContent: "space-evenly" }}
      >
        <Touchtip title={lang.bank.copy}>
          <IconButton
            onClick={() => copy(address)}
            children={<FileCopyOutlined />}
          />
        </Touchtip>
        {navigator.share && (
          <Touchtip title={lang.bank.share}>
            <IconButton onClick={share} children={<ShareOutlined />} />
          </Touchtip>
        )}
        <Touchtip title={lang.bank.view}>
          <IconButton onClick={view} children={<SearchOutlined />} />
        </Touchtip>
        {owner === account && (
          <>
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
          </>
        )}
      </Toolbar>
      {loading && (
        <Toolbar style={{ justifyContent: "center" }}>
          <CircularProgress color="primary" />
        </Toolbar>
      )}
    </>
  );
};
