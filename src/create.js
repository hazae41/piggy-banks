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
  const { settings, lang, web3, account, PiggyBanks } = app;
  const { fromWei, fromUtf8 } = web3.utils;

  const [name, setName] = useState(lang.create.defname);
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
      const { gasPrice } = settings;
      await PiggyBanks.methods
        .create(fromUtf8(name))
        .send({ from: account, value: price, gasPrice });

      const body = lang.notif.created;
      notify(name, { body });

      close();
    } catch (err) {}
    setLoading(false);
  };

  return (
    <Dialog disableEnforceFocus fullWidth scroll="body" open onClose={close}>
      <CardHeader
        title={lang.create.title}
        titleTypographyProps={{ style: bold }}
        action={<IconButton onClick={close} children={<CloseOutlined />} />}
        subheader={price && lang.create.price(fromWei(price))}
      />
      <DialogContent>
        <Card elevation={0}>
          <Box bgcolor="secondary.main">
            <Toolbar>
              <InputBase
                style={bold}
                fullWidth
                placeholder={lang.create.name}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Toolbar>
          </Box>
        </Card>
        {!valid && (
          <Box marginTop={1}>
            <Typography color="error" children={lang.create.toolong} />
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
              children={lang.create.create}
              startIcon={<AddOutlined />}
            />
          )}
        </Toolbar>
      </DialogContent>
    </Dialog>
  );
};
