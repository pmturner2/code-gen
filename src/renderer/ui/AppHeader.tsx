import {
  AppBar,
  createStyles,
  IconButton,
  makeStyles,
  Theme,
  Toolbar,
  Typography,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import * as React from 'react';

const useStyles = makeStyles((theme?: Theme) =>
  createStyles({
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
    },
  }),
);

export const AppHeader: React.FunctionComponent = props => {
  const classes = useStyles(props);
  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar variant="dense">
        <IconButton edge="start" className="menu-button" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" color="inherit">
          WWF Code Generator
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
