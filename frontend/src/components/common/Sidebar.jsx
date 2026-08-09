import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import GroupIcon from "@mui/icons-material/Group";
import HomeIcon from "@mui/icons-material/Home";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import StarIcon from "@mui/icons-material/Star";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { ROLES } from "../../utils/constants";

const drawerWidth = 240;

export default function Sidebar() {
  const { role } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    // Public
    { label: "Accueil", icon: <HomeIcon />, path: "/", roles: [ROLES.USAGER] },
    {
      label: "Vitrine",
      icon: <DescriptionIcon />,
      path: "/vitrine",
      roles: [ROLES.USAGER],
    },

    // Demandes
    {
      label: "Déposer une demande",
      icon: <AssignmentIcon />,
      path: "/depot",
      roles: [ROLES.USAGER],
    },
    {
      label: "Suivi des demandes",
      icon: <AssignmentIcon />,
      path: "/suivi",
      roles: [ROLES.USAGER],
    },

    // DCUVE
    {
      label: "Instruction DCUVE",
      icon: <AssignmentIcon />,
      path: "/instruction",
      roles: [ROLES.AGENT_DCUVE, ROLES.DIRECTEUR_DCUVE],
    },
    {
      label: "Commission",
      icon: <GroupIcon />,
      path: "/commission",
      roles: [ROLES.AGENT_DCUVE, ROLES.DIRECTEUR_DCUVE],
    },
    {
      label: "Validation Cartes",
      icon: <AdminPanelSettingsIcon />,
      path: "/validation-cartes",
      roles: [ROLES.AGENT_DCUVE],
    },

    // Occupant
    {
      label: "Espace Occupant",
      icon: <DescriptionIcon />,
      path: "/espace-occupant",
      roles: [ROLES.USAGER],
    },
    {
      label: "Paiements",
      icon: <DescriptionIcon />,
      path: "/paiement",
      roles: [ROLES.USAGER, ROLES.SERVICE_COMPTABLE],
    },

    // Terrain
    {
      label: "Signaler un problème",
      icon: <ReportProblemIcon />,
      path: "/signaler",
      roles: [ROLES.USAGER],
    },
    {
      label: "Dénoncer occupation",
      icon: <ReportProblemIcon />,
      path: "/denoncer",
      roles: [ROLES.USAGER],
    },
    {
      label: "Inspections QHSE",
      icon: <ReportProblemIcon />,
      path: "/inspection",
      roles: [ROLES.AGENT_QHSE, ROLES.AGENT_TERRAIN],
    },

    // Avis
    {
      label: "Avis cantine",
      icon: <StarIcon />,
      path: "/avis",
      roles: [ROLES.USAGER],
    },
    {
      label: "Modération avis",
      icon: <StarIcon />,
      path: "/moderation-avis",
      roles: [ROLES.CELLULE_COMMUNICATION],
    },

    // Direction
    {
      label: "Dashboard Direction",
      icon: <DashboardIcon />,
      path: "/dashboard-direction",
      roles: [ROLES.DIRECTEUR_CROUS_T],
    },

    // Admin
    {
      label: "Administration SI",
      icon: <AdminPanelSettingsIcon />,
      path: "/admin",
      roles: [ROLES.ADMINISTRATEUR_SI],
    },
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          position: "relative",
          height: "auto",
        },
      }}
    >
      <List>
        {filteredItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
