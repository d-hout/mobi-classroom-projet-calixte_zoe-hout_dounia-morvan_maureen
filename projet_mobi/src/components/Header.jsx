import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CastleIcon from "@mui/icons-material/Castle";
import AccountCircle from "@mui/icons-material/AccountCircle";
import StyleIcon from "@mui/icons-material/Style";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { logoutUser } from "../services/authService";
import { Link } from "react-router-dom";

export default function Header() {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  async function handleDeconnexion() {
    await logoutUser();
  }

  return (
    <Box className="app-header-wrap" sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        className="app-header"
        sx={{
          backgroundColor: "transparent",
          color: "#FFF",
          borderRadius: "22px",
          marginTop: "10px",
          boxShadow: "none",
          backgroundImage: "none",
        }}
      >
        <Toolbar className="app-header-toolbar">
          <Link
            to="/"
            className="app-header-brand"
          >
            <CastleIcon />
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: "bold", marginLeft: "10px" }}
            >
              DISNEY
            </Typography>
          </Link>

          <Box sx={{ flexGrow: 1 }} />

          <div>
            <Button
              component={Link}
              to="/rules"
              startIcon={<MenuBookIcon />}
              color="inherit"
              className="app-header-link"
            >
              Rules
            </Button>
            <IconButton
              component={Link}
              to="/collection"
              size="large"
              aria-label="collection de cartes"
              color="inherit"
              className="app-header-icon"
            >
              <StyleIcon />
            </IconButton>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              className="app-header-icon"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem component={Link} to="/profile" onClick={handleClose}>
                Profil
              </MenuItem>
              <MenuItem onClick={handleDeconnexion}>Se déconnecter</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
