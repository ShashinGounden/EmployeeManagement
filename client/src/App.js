import React, { useState, useEffect, useRef } from 'react';
import Axios from "axios";
import './App.css';
import AddEmployeeImage from "./assets/images/AddEmployee.png";
import HiearchyImage from "./assets/images/Hierarchy.png";
import md5 from 'md5';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencil, faTrash, faClose, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function App() {

  useEffect(() => {
    Axios.get("/api/get").then((response) => {
      setLoadAllEmployeeData(response.data);
      // console.log(response.data)
    })
  }, [])

  const fetchData = () => {
    Axios.get("/api/get", {
      params: {
        filterField,
        filterValue,
        sortField,
        sortOrder,
      },
    })
      .then((response) => {
        setLoadAllEmployeeData(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const [employeeData, setEmployeeData] = useState({
    employeeName: '',
    employeeSurname: '',
    employeeBirthDate: '',
    employeeNumber: '',
    employeeSalary: '',
    employeeRole: '',
    employeeEmail: '',
    employeeManager: null,
  });

  const [loadAllEmployeeData, setLoadAllEmployeeData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false); // Track if a row is being edited
  const [editedEmployee, setEditedEmployee] = useState({}); // Track the edited employee data
  const [editedReportingManager, setEditedReportingManager] = useState('');


  const [errorMessage, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployeeData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const fetchHierarchyData = () => {
    Axios.get("/api/employeeHierarchy")
      .then((response) => {
        setEmployeeHierarchyData(response.data);
        const hierarchy = buildEmployeeHierarchy(response.data);
        setEmployeeHierarchy(hierarchy);
      })
      .catch((error) => {
        console.error("ERROR HIERARCHY");
        console.error(error);
      });
  };

  const resetEmployeeData = () => {
    setEmployeeData({
      employeeName: '',
      employeeSurname: '',
      employeeBirthDate: '',
      employeeNumber: '',
      employeeSalary: '',
      employeeRole: '',
      employeeEmail: '',
      employeeManager: null,
    });
  };


  const handleSubmit = () => {
    if (isNameValid && isEmailValid && isDateValid && isValidSurname && isValidEmployeeNumber && isValidSalary && isValidRole && isValidManager) {
      Axios.post('/api/insert', {
        ...employeeData // Spread the employeeData object to send all fields
      })
        .then(response => {
          if (response.data.error) {
            setError(response.data.error);
          } else {
            setError(null);
            setIsModalOpen(false);
            fetchData(); // Update the employee data table
            fetchHierarchyData(); // Update the hierarchy data
            resetEmployeeData(); // Reset the form inputs
          }
        })
        .catch(error => {
          console.error(error.response.data.error);
          setError(error.response.data.error);
          alert(error.response.data.error);
        });
    }
    else {
      // Display an error message or handle invalid fields appropriately
      const errorMessages = [];

      // Check individual fields and add custom error messages
      if (!isNameValid) {
        errorMessages.push('Invalid name. Name should contain only alphabetical characters and be at least one character long.');
      }

      if (!isEmailValid) {
        errorMessages.push('Invalid email. Please enter a valid email address.');
      }

      if (!isDateValid) {
        errorMessages.push('Invalid birth date. Please select a valid date.');
      }

      if (!isValidSurname) {
        errorMessages.push('Invalid surname. Surname should contain only alphabetical characters and be at least one character long.');
      }

      if (!isValidEmployeeNumber) {
        errorMessages.push('Invalid employee number. Employee number should be a positive integer.');
      }

      if (!isValidSalary) {
        errorMessages.push('Invalid salary. Salary should be a positive number (integer or float).');
      }

      if (!isValidRole) {
        errorMessages.push('Invalid role. Role should contain only alphabetical characters and be at least one character long.');
      }

      if (!isValidManager) {
        errorMessages.push('Invalid reporting manager. Reporting manager should be an empty string or a positive integer.');
      }

      // Check if there are any error messages
      if (errorMessages.length > 0) {
        setError(errorMessages.join('\n'));
      }
    }
  };

  const handleEdit = (employee, index) => {
    // Initialize editedEmployee and editedReportingManager
    setEditedEmployee({ ...employee });
    setEditedReportingManager(employee.employeeManager);
    setIsEditing(index);
  };



  const handleSave = (index) => {
    Axios.put('/api/update/', {
      employeeName: editedEmployee.first_name,
      employeeSurname: editedEmployee.last_name,
      employeeBirthDate: editedEmployee.birth_date,
      employeeNumber: editedEmployee.employee_number,
      employeeSalary: editedEmployee.salary,
      employeeRole: editedEmployee.role,
      employeeEmail: editedEmployee.email,
      employeeManager: editedReportingManager,
    })
      .then((response) => {
        // Handle the response if needed
        // console.log(response);
        setIsEditing(false); // Disable editing mode

        // Update the local state with the edited employee data
        setLoadAllEmployeeData((prevData) => {
          const updatedData = [...prevData];
          updatedData[index] = { ...editedEmployee, employee_manager: editedReportingManager };
          return updatedData;
        });

        // Fetch hierarchy data after editing
        fetchHierarchyData();
      })
      .catch((error) => {
        // Handle errors if the request fails
        console.error(error);
      });
  };

  const handleDelete = (employeeNumber) => {
    Axios.delete(`/api/delete/${employeeNumber}`)
      .then(() => {
        // Remove the deleted employee from the hierarchy state
        setEmployeeHierarchy((prevHierarchy) => {
          // Recursively remove the employee from the hierarchy
          const removeEmployee = (hierarchy) => {
            for (const employeeId in hierarchy) {
              if (employeeId === employeeNumber) {
                delete hierarchy[employeeId];
              } else {
                removeEmployee(hierarchy[employeeId]);
              }
            }
          }
          removeEmployee({ ...prevHierarchy });
          return prevHierarchy;
        });

        setLoadAllEmployeeData((prevData) =>
          prevData.filter((employee) => employee.employee_number !== employeeNumber)
        );
      })
      .catch((error) => {
        console.error(error);
      });
  };


  const handleCancel = () => {
    setEditedEmployee({});
    setIsEditing(false);
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Create a ref for the file input element
  const fileInputRef = useRef(null);

  // Function to trigger the file input click event
  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to handle image upload
  const handleImageUpload = (event) => {
    const selectedFile = event.target.files[0];
    // Use Axios or any method to upload the selected image
    // You can send it to your server and update the employee's image
    if (selectedFile) {
      // Handle the image upload here
      // You can use Axios to send the file to the server
      // Update the employee's image with the response
    }
  };

  const [employeeHierarchyData, setEmployeeHierarchyData] = useState([]);
  const [employeeHierarchy, setEmployeeHierarchy] = useState({});

  useEffect(() => {
    Axios.get("/api/employeeHierarchy")
      .then((response) => {
        setEmployeeHierarchyData(response.data);
        const hierarchy = buildEmployeeHierarchy(response.data);
        setEmployeeHierarchy(hierarchy);
      })
      .catch((error) => {
        // console.log("ERROR HIERARCHY");
        console.error(error);
      });
  }, []);

  const buildEmployeeHierarchy = (data) => {
    const hierarchy = {};

    // Create a map of employees for quick access by employee number
    const employeeMap = new Map();
    data.forEach((employee) => {
      employeeMap.set(employee.employee_number, employee);
    });

    data.forEach((employee) => {
      if (employee.manager_id === null) {
        hierarchy[employee.employee_number] = buildSubtree(employee.employee_number, employeeMap);
      }
    });

    return hierarchy;
  };

  const buildSubtree = (employeeNumber, employeeMap) => {
    const subtree = {};
    for (const employee of employeeMap.values()) {
      if (employee.manager_id === employeeNumber) {
        subtree[employee.employee_number] = buildSubtree(employee.employee_number, employeeMap);
      }
    }
    return subtree;
  };

  const [searchText, setSearchText] = useState('');

  const renderHierarchy = (hierarchy, managerId = null) => {
    const filteredHierarchy = filterHierarchy(hierarchy, searchText);

    return (
      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        style={{ width: "80%", textAlign: "center", backgroundColor: "#E5E4E2", borderRadius: "4px" }}
      >
        {Object.keys(filteredHierarchy).map((employeeNumber) => {
          const employee = employeeHierarchyData.find((e) => e.employee_number === employeeNumber);
          // console.log(employee);

          return (
            <TreeItem
              key={employeeNumber}
              nodeId={employeeNumber}
              label={`${employee.first_name} ${employee.last_name} `}
              style={{ padding: "10px" }}
            >


              {/* Display additional information */}
              <div>
                <p><strong>Surname:</strong> {employee.last_name}</p>
                <p><strong>Role:</strong> {employee.role}</p>
                <p><strong>Salary:</strong> {employee.salary}</p>
                <p><strong>Email:</strong> {employee.email}</p>
                <p><strong>Birth Date:</strong> {formatDate(employee.birth_date)}</p>
              </div>

              <button onClick={() => handleDelete(employee.employee_number)} style={{ background: "none" }}>
                <FontAwesomeIcon icon={faTrash} style={{ color: "#e32f45" }} />
              </button>

              {renderHierarchy(filteredHierarchy[employeeNumber], employeeNumber)}
            </TreeItem>
          );
        })}
      </TreeView>
    );
  };



  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 6; // Number of employees to display per page

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = loadAllEmployeeData.slice(indexOfFirstEmployee, indexOfLastEmployee);


  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const [columnNames, setColumnNames] = useState([]);
  const [sortFields, setSortFields] = useState([]);

  const validateName = (name) => {
    const namePattern = /^[A-Za-z]+$/; // This pattern allows only alphabetical characters

    return name.length > 0 && namePattern.test(name);
  };

  const validateSurname = (name) => {
    const namePattern = /^[A-Za-z]+$/; // This pattern allows only alphabetical characters

    return name.length > 0 && namePattern.test(name);
  };

  const validateRole = (name) => {
    const namePattern = /^[A-Za-z\s]+$/;

    return name.length > 0 && namePattern.test(name);
  };

  const validateEmail = (email) => {
    // You can use a regular expression to validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateDate = (date) => {
    // You can add more specific date validation logic here
    return date.trim() !== '';
  };

  const validateEmployeeNumber = (employeeNumber) => {
    const employeeNumberPattern = /^\d+$/; // This pattern matches one or more digits

    return employeeNumberPattern.test(employeeNumber);
  };

  const validateSalary = (salary) => {
    const salaryPattern = /^\d+(\.\d+)?$/; // This pattern matches integers and floats

    return salaryPattern.test(salary) && parseFloat(salary) > 0;
  };

  const validateManagerNumber = (managerNumber) => {
    // Check if the managerNumber is an empty string or a positive integer
    return managerNumber === null || (/^\d+$/.test(managerNumber) && parseInt(managerNumber) > 0);
  };







  const isNameValid = validateName(employeeData.employeeName);
  const isEmailValid = validateEmail(employeeData.employeeEmail);
  const isDateValid = validateDate(employeeData.employeeBirthDate);
  const isValidSurname = validateSurname(employeeData.employeeSurname);
  const isValidEmployeeNumber = validateEmployeeNumber(employeeData.employeeNumber);
  const isValidSalary = validateSalary(employeeData.employeeSalary);
  const isValidRole = validateRole(employeeData.employeeRole);
  const isValidManager = validateManagerNumber(employeeData.employeeManager);;

  useEffect(() => {
    // Fetch column names for filtering
    Axios.get("/api/columns")
      .then((response) => {
        setColumnNames(response.data);
      })
      .catch((error) => {
        console.error(error);
      });

    // Fetch column names for sorting
    Axios.get("/api/sort-fields")
      .then((response) => {
        setSortFields(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const filterHierarchy = (hierarchy, searchText) => {
    const filteredHierarchy = {};

    for (const employeeNumber in hierarchy) {
      const employee = employeeHierarchyData.find((e) => e.employee_number === employeeNumber);

      if (
        employee.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(searchText.toLowerCase())
      ) {
        // If the employee matches the search criteria, include them in the filtered hierarchy
        filteredHierarchy[employeeNumber] = filterHierarchy(hierarchy[employeeNumber], searchText);
      } else {
        // If the employee doesn't match the search criteria, check their subordinates
        const subordinates = filterHierarchy(hierarchy[employeeNumber], searchText);

        if (Object.keys(subordinates).length > 0) {
          // If there are matching subordinates, include the manager and their subordinates
          filteredHierarchy[employeeNumber] = subordinates;
        }
      }
    }

    return filteredHierarchy;
  };




  return (
    <div>
      <div className="container">
        {/* Filter */}



        {isModalOpen && (
          <div className="modal">

            <div className="form">

              <FontAwesomeIcon
                icon={faClose}
                className="close-icon"
                onClick={() => setIsModalOpen(false)}
              />

              <h1 style={{ fontWeight: "400" }}>Enter employee details</h1>


              <label>Email:</label>
              <input
                type="email"
                name="employeeEmail"
                value={employeeData.employeeEmail}
                onChange={handleChange}
                className='employeeInput'
                placeholder='example@email.com'
              />


              <label>Name:</label>
              <input
                type="text"
                name="employeeName"
                value={employeeData.employeeName}
                onChange={handleChange}
                className='employeeInput'
                placeholder='John'
              />

              <label>Surname:</label>
              <input
                type="text"
                name="employeeSurname"
                value={employeeData.employeeSurname}
                onChange={handleChange}
                className='employeeInput'
                placeholder='Doe'
              />

              <label>Birth Date:</label>
              <input
                type="date"
                name="employeeBirthDate"
                value={employeeData.employeeBirthDate}
                onChange={handleChange}
                style={{ width: "310px", height: "80px", textAlign: "center", border: "0.5px solid grey", boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)" }}
              />

              <label>Employee Number:</label>
              <input
                type="text"
                name="employeeNumber"
                value={employeeData.employeeNumber}
                onChange={handleChange}
                className='employeeInput'
                placeholder='e.g. 123456'
              />

              <label>Salary:</label>
              <input
                type="text"
                name="employeeSalary"
                value={employeeData.employeeSalary}
                onChange={handleChange}
                className='employeeInput'
                placeholder='e.g. 200000'
              />

              <label>Role:</label>
              <input
                type="text"
                name="employeeRole"
                value={employeeData.employeeRole}
                onChange={handleChange}
                className='employeeInput'
                placeholder='e.g. Technical Consultant'
              />

              <label>Reporting Manager:</label>
              <input
                type="text"
                name="employeeManager"
                value={employeeData.employeeManager}
                onChange={handleChange}
                className='employeeInput'
                placeholder='e.g. 75648'
              />

              {errorMessage && <div className="error-message">{errorMessage}</div>}

              <button className='submitButton' onClick={handleSubmit}>Submit</button>

            </div>
          </div>
        )}


        <div className='main_heading_container'>
          <h1 className='main_heading'>Employee Management System</h1>
          <div className='sub_heading'>
            <p>Use this table to edit or delete employees if needed. <br />You can add an employee using the "+" icon located at the top of the table</p>
          </div>

          <img className="table_image" src={AddEmployeeImage} alt='AddEmployeeImage' />

        </div>





        <div className="employee-table">

          {/* Plus icon to toggle the modal */}
          <button onClick={() => setIsModalOpen(true)} className="add-button">
            +
          </button>

          <div className='table_filters'>

            <input
              type="text"
              placeholder="Filter Value"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className='filter_value'
            />

            {/* Sort */}

            <select onChange={(e) => setFilterField(e.target.value)} className='filter_select'>
              <option value="">Filter</option>
              {columnNames.map((columnName) => (
                <option key={columnName} value={columnName}>
                  {columnName}
                </option>
              ))}
            </select>
            <select onChange={(e) => setSortField(e.target.value)} className='filter_select'>
              <option value="">Sort By</option>
              {sortFields.map((sortField) => (
                <option key={sortField} value={sortField}>
                  {sortField}
                </option>
              ))}
            </select>





            <select onChange={(e) => setSortOrder(e.target.value)} className='filter_select'>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>



            <button onClick={fetchData}>Search</button>
          </div>


          <table>


            <thead className='table_head'>
              <tr>
                <th className="center">Employee Picture</th>
                <th className="center">Name</th>
                <th className="center">Surname</th>
                <th className="center">Birth Date</th>
                <th className="center">Employee Number</th>
                <th className="center">Salary</th>
                <th className="center">Role</th>
                <th className="center">Email</th>
                <th className="center">Reporting Manager</th>
                <th className="center">Edit</th>
                <th className="center">Delete</th>


              </tr>
            </thead>

            <tbody>


              {currentEmployees.map((employee, index) => (
                <tr key={index}>
                  <td className="center">
                    <div className="profile-image-container">
                      <img
                        src={`https://www.gravatar.com/avatar/${md5(employee.email)}?d=identicon`}
                        alt="Gravatar"
                        className='profile_image'
                      />
                      <FontAwesomeIcon
                        icon={faPlus}
                        className="plus-icon"
                        onClick={handleImageUploadClick}
                        style={{
                          border: "none", borderRadius: "50%", width: "15px", height: "15px", color: "white", backgroundColor: "#0056b3", position: "relative", left: "-15%"
                        }}
                      />
                      {/* Hidden file input for image upload */}
                      < input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                      />
                    </div>
                  </td>
                  <td className="center">
                    {isEditing === index ? (
                      <input
                        type="text"
                        name="employeeName"
                        value={editedEmployee.first_name}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, first_name: e.target.value })}
                        className='editInput'
                      />
                    ) : (
                      employee.first_name
                    )}
                  </td>
                  <td className="center">
                    {isEditing === index ? (
                      <input
                        type="text"
                        name="employeeSurname"
                        value={editedEmployee.last_name}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, last_name: e.target.value })}
                        className='editInput'
                      />
                    ) : (
                      employee.last_name
                    )}
                  </td>
                  <td className="center">
                    {isEditing === index ? (

                      <input
                        type="date"
                        name="employeeBirthDate"
                        value={formatDate(editedEmployee.birth_date)}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, birth_date: e.target.value })}
                        className='editInput'
                      />
                    ) : (
                      formatDate(employee.birth_date)
                    )}
                  </td>
                  <td className="center">
                    {employee.employee_number}
                  </td>

                  <td className="center">
                    {isEditing === index ? (
                      <input
                        type="text"
                        name="employeeSalary"
                        value={editedEmployee.salary}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, salary: e.target.value })}
                        className='editInput'
                      />
                    ) : (
                      employee.salary
                    )}
                  </td>

                  <td className="center">
                    {isEditing === index ? (
                      <input
                        type="text"
                        name="employeeRole"
                        value={editedEmployee.role}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, role: e.target.value })}
                        className='editInput'
                      />
                    ) : (
                      employee.role
                    )}
                  </td>

                  <td className="center">
                    {isEditing === index ? (
                      <input
                        type="text"
                        name="employeeEmail"
                        value={editedEmployee.email}
                        onChange={(e) => setEditedEmployee({ ...editedEmployee, email: e.target.value })}
                        className='editInput'
                      />
                    ) : (
                      employee.email
                    )}
                  </td>

                  <td className="center">
                    {isEditing === index ? (
                      <input
                        type="text"
                        name="employeeManager"
                        value={editedReportingManager}
                        onChange={(e) => setEditedReportingManager(e.target.value)}
                        className='editInput'
                        placeholder='Manager #'
                      />
                    ) : (
                      employee.manager_first_name && employee.manager_last_name
                        ? `${employee.manager_first_name} ${employee.manager_last_name}`
                        : "None"
                    )}
                  </td>


                  <td className="center">
                    {isEditing === index ? (
                      <button onClick={() => handleSave(index)} style={{ background: "none" }}>
                        <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} />
                      </button>
                    ) : (
                      <button onClick={() => handleEdit(employee, index)} style={{ background: "none" }}>
                        <FontAwesomeIcon icon={faPencil} style={{ color: "#007bff" }} />
                      </button>
                    )}
                  </td>
                  <td className="center">
                    {isEditing === index ? (
                      <button onClick={handleCancel} style={{ background: "none" }}>
                        <FontAwesomeIcon icon={faTimes} style={{ color: "red" }} />
                      </button>
                    ) : (
                      <button onClick={() => handleDelete(employee.employee_number)} style={{ background: "none" }}>
                        <FontAwesomeIcon icon={faTrash} style={{ color: "#e32f45" }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className='table_navigator_button'
            >
              &#x2190; Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={indexOfLastEmployee >= loadAllEmployeeData.length}
              className='table_navigator_button'
            >
              Next &#x2192;
            </button>


          </div>

        </div>


      </div>

      <div className="employee-hierarchy">
        <h1 className='main_heading_hierarchy'>Employee Hierarchy</h1>

        <p>Use this to visualise the employee hiearchy. You can use the hierarchy to find, edit or delete employee data.</p>
        <img className="table_image" src={HiearchyImage} alt='AddEmployeeImage' />

        <h3>Hierarchy Tree:</h3>
        <input
          type="text"
          placeholder="Search employees"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className='search_employee'
        />

        <div className="hierarchy-tree">
          {renderHierarchy(employeeHierarchy)}
        </div>
      </div>


    </div>
  );
}

export default App;
