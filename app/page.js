"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Modal,
  Stack,
  TextField,
  Typography,
  Paper,
  Menu,
  MenuItem,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  IconButton,
  Fade,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExportIcon from "@mui/icons-material/GetApp";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { firestore } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#3f51b5",
    },
    secondary: {
      main: "#f50057",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
          },
        },
      },
    },
  },
});

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function Home() {
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(2);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemDetails, setItemDetails] = useState({
    name: "",
    quantity: 0,
    description: "",
    price: 0,
    supplier: "",
  });
  const [anchorEl, setAnchorEl] = useState(null);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "inventory"));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ id: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  useEffect(() => {
    setFilteredInventory(
      inventory.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setCurrentPage(1);
  }, [searchQuery, inventory]);

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item.name);
    await setDoc(docRef, item);
    await updateInventory();
  };

  const updateItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item.id);
    await setDoc(docRef, item);
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { ...docSnap.data(), quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const handleOpen = () => {
    setItemDetails({
      name: "",
      quantity: 0,
      description: "",
      price: 0,
      supplier: "",
    });
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setItemDetails({
      name: "",
      quantity: 0,
      description: "",
      price: 0,
      supplier: "",
    });
  };
  const handleDetailsOpen = (item) => {
    setSelectedItem(item);
    setItemDetails(item);
    setDetailsOpen(true);
  };
  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedItem(null);
    setItemDetails({
      name: "",
      quantity: 0,
      description: "",
      price: 0,
      supplier: "",
    });
  };

  const handleItemUpdate = () => {
    updateItem(itemDetails);
    handleDetailsClose();
  };

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Name", "Quantity", "Description", "Price", "Supplier"],
      ...inventory.map((item) => [
        item.name,
        item.quantity,
        item.description,
        item.price,
        item.supplier,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "inventory.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    handleExportClose();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Name", "Quantity", "Description", "Price", "Supplier"]],
      body: inventory.map((item) => [
        item.name,
        item.quantity,
        item.description,
        item.price,
        item.supplier,
      ]),
    });
    doc.save("inventory.pdf");
    handleExportClose();
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "#f0f2f5",
          paddingTop: { xs: "100px", sm: "130px" },
          paddingX: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            width: "100%",
            position: "fixed",
            top: 0,
            left: 0,
            bgcolor: "primary.main",
            padding: { xs: 2, sm: 3 },
            boxShadow: 3,
            textAlign: "center",
            zIndex: 1,
          }}
        >
          <Typography
            variant={isMobile ? "h4" : "h2"}
            sx={{
              fontWeight: "bold",
              color: "white",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            Inventory Management
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "800px",
            marginTop: 2,
            marginBottom: 4,
          }}
        >
          <TextField
            label="Search Items"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
            }}
          />
        </Box>

        {/* Add Item Modal */}
        <Modal open={open} onClose={handleClose}>
          <Box sx={modalStyle}>
            <Typography variant="h6" component="h2" gutterBottom>
              Add Item
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Item Name"
                variant="outlined"
                fullWidth
                value={itemDetails.name}
                onChange={(e) =>
                  setItemDetails({ ...itemDetails, name: e.target.value })
                }
              />
              <TextField
                label="Quantity"
                variant="outlined"
                fullWidth
                type="number"
                value={itemDetails.quantity}
                onChange={(e) =>
                  setItemDetails({
                    ...itemDetails,
                    quantity: parseInt(e.target.value),
                  })
                }
              />
              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                value={itemDetails.description}
                onChange={(e) =>
                  setItemDetails({
                    ...itemDetails,
                    description: e.target.value,
                  })
                }
              />
              <TextField
                label="Price"
                variant="outlined"
                fullWidth
                type="number"
                value={itemDetails.price}
                onChange={(e) =>
                  setItemDetails({
                    ...itemDetails,
                    price: parseFloat(e.target.value),
                  })
                }
              />
              <TextField
                label="Supplier"
                variant="outlined"
                fullWidth
                value={itemDetails.supplier}
                onChange={(e) =>
                  setItemDetails({ ...itemDetails, supplier: e.target.value })
                }
              />
              <Button
                variant="contained"
                onClick={() => {
                  addItem(itemDetails);
                  handleClose();
                }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        </Modal>

        {/* Item Details Modal */}
        <Modal open={detailsOpen} onClose={handleDetailsClose}>
          <Box sx={modalStyle}>
            <Typography variant="h6" component="h2" gutterBottom>
              Item Details
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Item Name"
                variant="outlined"
                fullWidth
                value={itemDetails.name}
                onChange={(e) =>
                  setItemDetails({ ...itemDetails, name: e.target.value })
                }
              />
              <TextField
                label="Quantity"
                variant="outlined"
                fullWidth
                type="number"
                value={itemDetails.quantity}
                onChange={(e) =>
                  setItemDetails({
                    ...itemDetails,
                    quantity: parseInt(e.target.value),
                  })
                }
              />
              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                value={itemDetails.description}
                onChange={(e) =>
                  setItemDetails({
                    ...itemDetails,
                    description: e.target.value,
                  })
                }
              />
              <TextField
                label="Price"
                variant="outlined"
                fullWidth
                type="number"
                value={itemDetails.price}
                onChange={(e) =>
                  setItemDetails({
                    ...itemDetails,
                    price: parseFloat(e.target.value),
                  })
                }
              />
              <TextField
                label="Supplier"
                variant="outlined"
                fullWidth
                value={itemDetails.supplier}
                onChange={(e) =>
                  setItemDetails({ ...itemDetails, supplier: e.target.value })
                }
              />
              <Button variant="contained" onClick={handleItemUpdate}>
                Update
              </Button>
            </Stack>
          </Box>
        </Modal>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "800px",
            mb: 4,
          }}
        >
          <Fade in={true} style={{ transitionDelay: "100ms" }}>
            <Button
              variant="contained"
              onClick={handleOpen}
              startIcon={<AddIcon />}
              size={isMobile ? "small" : "medium"}
            >
              {isMobile ? "Add" : "Add New Item"}
            </Button>
          </Fade>
          <Fade in={true} style={{ transitionDelay: "200ms" }}>
            <Button
              variant="contained"
              onClick={handleExportClick}
              startIcon={<ExportIcon />}
              size={isMobile ? "small" : "medium"}
            >
              {isMobile ? "Export" : "Export Data"}
            </Button>
          </Fade>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={exportToCSV}>Export as CSV</MenuItem>
            <MenuItem onClick={exportToPDF}>Export as PDF</MenuItem>
          </Menu>
        </Box>

        {/* Inventory List */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "800px",
            mb: 4,
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, fontWeight: "medium" }}>
            Inventory Items
          </Typography>
          <Stack spacing={2}>
            {currentItems.map((item, index) => (
              <Fade
                key={item.id}
                in={true}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Quantity: {item.quantity}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Price: ${item.price.toFixed(2)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleDetailsOpen(item)}
                    >
                      Details
                    </Button>
                    <Button
                      size="small"
                      color="secondary"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeItem(item)}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Fade>
            ))}
          </Stack>
        </Box>

        {/* Pagination */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 4 }}>
          <Button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <Typography variant="body2" sx={{ margin: "0 16px" }}>
            Page {currentPage} of {totalPages}
          </Typography>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
