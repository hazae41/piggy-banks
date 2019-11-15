import React, { useState, useMemo } from "react";
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
import { CloseOutlined, EditOutlined } from "@material-ui/icons";

export const RenameDialog = ({ app, bank, navigate }) => {
  const close = () => navigate("..");

  const { settings, lang, web3, account } = app;
  const { fromUtf8 } = web3.utils;
  const { name: oldName, owner, contract } = bank;

  const [name, setName] = useState(oldName);
  const valid = useMemo(() => fromUtf8(name).length <= 66, [name]);

  const [loading, setLoading] = useState(false);

  const rename = async () => {
    setLoading(true);
    try {
      const { gasPrice } = settings;
      await contract.methods
        .rename(fromUtf8(name))
        .send({ from: account, gasPrice });

      const body = lang.notif.renamed(name);
      notify(oldName, { body });

      close();
    } catch (err) {}
    setLoading(false);
  };

  return account !== owner ? null : (
    <Dialog disableEnforceFocus fullWidth scroll="body" open onClose={close}>
      <CardHeader
        title={lang.rename.title(oldName)}
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
                placeholder={lang.rename.name}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Toolbar>
          </Box>
        </Card>
        {!valid && (
          <Box marginTop={1}>
            <Typography color="error" children={lang.rename.toolong} />
          </Box>
        )}
        <Toolbar disableGutters style={{ justifyContent: "center" }}>
          {loading && <CircularProgress color="primary" />}
          {!loading && (
            <Button
              disabled={!name || !valid || name === oldName}
              onClick={rename}
              color="primary"
              fullWidth
              style={{ ...bold, boxShadow: "none" }}
              variant="contained"
              children={lang.rename.rename}
              startIcon={<EditOutlined />}
            />
          )}
        </Toolbar>
      </DialogContent>
    </Dialog>
  );
};
