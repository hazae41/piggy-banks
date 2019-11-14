import { useState } from "react";
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

  const { web3, account } = app;
  const { isAddress, toWei } = web3.utils;
  const { name, owner, contract } = bank;

  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);

  const transfer = async () => {
    setLoading(true);
    try {
      await contract.methods
        .transfer(target)
        .send({ from: account, gasPrice: toWei("1", "gwei") });

      const body = `"${name}" has successfully been transfered 🐷`;
      notify("Transfered!", { body });

      close();
    } catch (err) {}
    setLoading(false);
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
              children="Transfer"
              startIcon={<PeopleOutlined />}
            />
          )}
        </Toolbar>
      </DialogContent>
    </Dialog>
  );
};
