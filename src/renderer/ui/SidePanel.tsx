import {
  createStyles,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  Theme,
} from '@material-ui/core';
import React from 'react';

export interface ISidePanelSection {
  options: ISidePanelOption[];
}

export interface ISidePanelOption {
  id: string;
  title: string;
  onClick: () => void;
}

interface IProps {
  sections: ISidePanelSection[];
}

const kDrawerWidth = 240;

const useStyles = makeStyles((theme?: Theme) =>
  createStyles({
    drawer: {
      flexShrink: 0,
      width: kDrawerWidth,
    },
    drawerPaper: {
      width: kDrawerWidth,
    },
    toolbar: theme.mixins.toolbar,
  }),
);

/**
 * Panel on the left side of the screen with options
 */
export const SidePanel: React.FunctionComponent<IProps> = props => {
  const classes = useStyles(props);
  return (
    <Drawer
      variant="permanent"
      className={classes.drawer}
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <div className={classes.toolbar} />
      {props.sections.map((section, index) => (
        <React.Fragment key={`${index}`}>
          <List>
            {section.options.map(option => (
              <ListItem button key={option.title} onClick={option.onClick}>
                <ListItemText primary={option.title} />
              </ListItem>
            ))}
          </List>
          <Divider />
        </React.Fragment>
      ))}
    </Drawer>
  );
};
