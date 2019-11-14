import React, { useState, useMemo, useEffect } from "react";
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
  Typography,
  CircularProgress,
  Button
} from "@material-ui/core";
import { bold } from "./styles";
import { CloseOutlined, AddOutlined } from "@material-ui/icons";

export const CreateDialog = ({ app, navigate }) => {
  const close = () => navigate("..");
  const { web3, account, PiggyBanks } = app;
  const { fromWei, fromUtf8, toWei } = web3.utils;

  const [name, setName] = useState("My piggy bank 🐷");
  const valid = useMemo(() => fromUtf8(name).length <= 66, [name]);

  const [price, setPrice] = useState();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!PiggyBanks) return;
    PiggyBanks.methods
      .price()
      .call()
      .then(setPrice);
  }, [PiggyBanks]);

  const create = async () => {
    setLoading(true);
    try {
      await PiggyBanks.methods
        .create(fromUtf8(name))
        .send({ from: account, value: price, gasPrice: toWei("1", "gwei") });

      const body = `"${name}" has successfully been created`;
      notify("Created!", { body });

      close();
    } catch (err) {}
    setLoading(false);
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
          {loading && <CircularProgress color="primary" />}
          {!loading && (
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
