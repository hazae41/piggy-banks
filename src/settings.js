import React from "react";
import {
  CardHeader,
  Dialog,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardContent,
  Typography,
  Slider,
  Toolbar,
  Box
} from "@material-ui/core";
import { bold } from "./styles";
import { CloseOutlined } from "@material-ui/icons";

export const SettingsDialog = ({ app, setSettings, navigate }) => {
  const close = () => navigate("..");
  const { settings, web3 } = app;
  const { fromWei } = web3.utils;

  const { lang, gasPrice } = settings;
  const setLang = lang => setSettings({ ...settings, lang });
  const setGasPrice = gasPrice => setSettings({ ...settings, gasPrice });

  return (
    <Dialog disableEnforceFocus fullWidth scroll="body" open onClose={close}>
      <CardHeader
        title={app.lang.settings.title}
        titleTypographyProps={{ style: bold }}
        action={<IconButton onClick={close} children={<CloseOutlined />} />}
      />
      <CardContent>
        <Toolbar disableGutters>
          <Typography style={bold} children={app.lang.settings.lang} />
          <Box flex={1} />
          <Select value={lang} onChange={e => setLang(e.target.value)}>
            <MenuItem value={"en"}>English</MenuItem>
            <MenuItem value={"fr"}>Français</MenuItem>
          </Select>
          <Box width={16} />
        </Toolbar>
        <Typography
          style={bold}
          children={app.lang.settings.gasPrice + " (GWei)"}
        />
        <Toolbar>
          <Slider
            value={gasPrice}
            onChange={(_, value) => setGasPrice(value)}
            valueLabelDisplay="auto"
            valueLabelFormat={x => fromWei(`${x}`, "gwei").substring(0, 3)}
            min={100000000}
            max={10000000000}
          />
        </Toolbar>
      </CardContent>
    </Dialog>
  );
};
