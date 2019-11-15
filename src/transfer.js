import React, { useState } from "react";
import { notify } from "./serviceWorker";
import {
  Dialog,
  CardHeader,
  IconButton,
  DialogContent,
  Card,
  Box,
  Toolbar,
  InputBase,
  CircularProgress,
  Button
} from "@material-ui/core";
import { bold } from "./styles";
import { CloseOutlined, PeopleOutlined } from "@material-ui/icons";

export const TransferDialog = ({ app, bank, navigate }) => {
  const close = () => navigate("..");

  const { settings, lang, web3, account } = app;
  const { isAddress } = web3.utils;
  const { name, owner, contract } = bank;

  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);

  const transfer = async () => {
    setLoading(true);
    try {
      const { gasPrice } = settings;
      await contract.methods.transfer(target).send({ from: account, gasPrice });

      const body = lang.notif.transferred(target);
      notify(bank.name, { body });

      close();
    } catch (err) {}
    setLoading(false);
  };

  return account !== owner ? null : (
    <Dialog disableEnforceFocus fullWidth scroll="body" open onClose={close}>
      <CardHeader
        title={lang.transfer.title(name)}
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
                placeholder={lang.transfer.target}
                value={target}
                onChange={e => setTarget(e.target.value)}
              />
            </Toolbar>
          </Box>
        </Card>
        <Toolbar disableGutters style={{ justifyContent: "center" }}>
          {loading && <CircularProgress color="primary" />}
          {!loading && (
            <Button
              disabled={!isAddress(target) || target === account}
              onClick={transfer}
              color="primary"
              fullWidth
              style={{ ...bold, boxShadow: "none" }}
              variant="contained"
              children={lang.transfer.transfer}
              startIcon={<PeopleOutlined />}
            />
          )}
        </Toolbar>
      </DialogContent>
    </Dialog>
  );
};
