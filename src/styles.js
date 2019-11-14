import { Tooltip, Typography } from "@material-ui/core";
import { pink } from "@material-ui/core/colors";
import { createMuiTheme } from "@material-ui/core/styles";
import React from "react";
import "./styles.css";

export const bold = { fontWeight: "bold" };

export const ellipsis = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
};

export const piggyDark = createMuiTheme({
  palette: {
    type: "dark",
    primary: pink,
    secondary: pink
  },
  overrides: {
    MuiCardHeader: {
      content: ellipsis
    }
  }
});

export const piggyLight = createMuiTheme({
  palette: {
    primary: pink,
    secondary: { main: "#eeeeee" }
  },
  overrides: {
    MuiCardHeader: {
      content: ellipsis
    }
  }
});

export const BoldTypography = ({ style, ...props }) => (
  <Typography style={{ ...bold, ...style }} {...props} />
);

export const Touchtip = props => <Tooltip enterTouchDelay={0} {...props} />;
