import AppBar from "@mui/material/AppBar";

import Box from "@mui/material/Box";

import Button from "@mui/material/Button";

import Toolbar from "@mui/material/Toolbar";

import Typography from "@mui/material/Typography";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";



export default function Header() {

  const { isAuthenticated, user, logout } = useAuth();

  const navigate = useNavigate();



  const handleLogout = async () => {

    await logout();

    navigate("/login");

  };



  return (

    <AppBar position="static">

      <Toolbar>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>

          <Link to="/" className="text-on-navy no-underline">

            VCN - Gestion des Locaux

          </Link>

        </Typography>



        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>

          {isAuthenticated ? (

            <>

              <Typography variant="body2" className="text-on-navy">

                {user?.nom_complet}

              </Typography>

              <Button color="inherit" onClick={handleLogout}>

                Déconnexion

              </Button>

            </>

          ) : (

            <>

              <Button color="inherit" component={Link} to="/login">

                Connexion

              </Button>

              <Button color="inherit" component={Link} to="/signup">

                Inscription

              </Button>

            </>

          )}

        </Box>

      </Toolbar>

    </AppBar>

  );

}



