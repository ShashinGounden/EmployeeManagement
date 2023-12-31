const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const cors = require('cors')

if (process.env.PRODUCTION != "True"){
    require('dotenv').config()
}


console.log(process.env);

const db = mysql.createPool(
    {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    }
)

console.log(db)



app.use(cors());

app.use(express.json())

app.use(bodyParser.urlencoded({ extended: true }))

app.get("/", (req, res) => {

    /*  const sqlInsert = "INSERT INTO Employee (Name, Surname, BirthDate, EmployeeNumber, Salary, Role) VALUES ('a', 'a','a','a','a', 'a','a');"
      db.query(sqlInsert, (err, result) => {
          res.send(result);
      }) */
})

app.post("/api/insert", (req, res) => {
    const {
        employeeName,
        employeeSurname,
        employeeBirthDate,
        employeeNumber,
        employeeSalary,
        employeeRole,
        employeeEmail,
        employeeManager
    } = req.body;

    if (!employeeName || !employeeSurname || !employeeBirthDate || !employeeNumber || !employeeSalary || !employeeRole) {
        return res.status(400).json({ error: "All required fields must be provided." });
    }

    const formattedBirthDate = new Date(employeeBirthDate).toISOString().split('T')[0];
    console.log(formattedBirthDate);

    const sqlInsert = "INSERT INTO Employee (first_name, last_name, birth_date, employee_number, salary, role, email, manager_id) VALUES (?,?,?,?,?,?,?, ?);";

    db.query(sqlInsert, [employeeName, employeeSurname, employeeBirthDate, employeeNumber, employeeSalary, employeeRole, employeeEmail, employeeManager],
        (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send(result);
            }
        })
    // Rest of your code to insert the employee into the database
});


app.get("/api/get", (req, res) => {
    const { filterField, filterValue, sortField, sortOrder } = req.query;

    let sqlSelect = `
      SELECT e.*, m.first_name AS manager_first_name, m.last_name AS manager_last_name
      FROM Employee e
      LEFT JOIN Employee m ON e.manager_id = m.employee_number
    `;

    if (filterField && filterValue) {
        // Specify the table name for the filterField to remove ambiguity
        sqlSelect += ` WHERE e.${filterField} LIKE '%${filterValue}%'`;
    }

    if (sortField && sortOrder) {
        // Specify the table name for the sortField to remove ambiguity
        sqlSelect += ` ORDER BY e.${sortField} ${sortOrder}`;
    }

    db.query(sqlSelect, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: "An error occurred while fetching employee data." });
        } else {
            res.json(result);
        }
    });
});

app.get("/api/columns", (req, res) => {
    const sqlColumns = "SHOW COLUMNS FROM Employee";
    db.query(sqlColumns, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: "An error occurred while fetching column names." });
        } else {
            const columnNames = result.map(row => row.Field);
            res.json(columnNames);
        }
    });
});

app.get("/api/sort-fields", (req, res) => {
    const sqlColumns = "SHOW COLUMNS FROM Employee";
    db.query(sqlColumns, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: "An error occurred while fetching column names for sorting." });
        } else {
            const columnNames = result.map(row => row.Field);
            res.json(columnNames);
        }
    });
});


app.delete("/api/delete/:employeeNumber", (req, res) => {
    const employeeID = req.params.employeeNumber;

    if (!employeeID) {
        return res.status(400).json({ error: "No employee id." });
    }

    const sqlDelete = "DELETE FROM Employee WHERE employee_number = ?";

    db.query(sqlDelete, employeeID, (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            res.json(result);
        }
    });
})

app.put("/api/update", (req, res) => {
    const {
        employeeName,
        employeeSurname,
        employeeBirthDate,
        employeeNumber,
        employeeSalary,
        employeeRole,
        employeeEmail,
        employeeManager
    } = req.body;

    if (!employeeName || !employeeSurname || !employeeBirthDate || !employeeNumber || !employeeSalary || !employeeRole) {
        return res.status(400).json({ error: "All required fields must be provided." });
    }

    const formattedBirthDate = new Date(employeeBirthDate).toISOString().split('T')[0];


    const sqlUpdate = `
          UPDATE Employee SET first_name = ?, last_name = ?, birth_date = ?, salary = ?, role = ?, email= ?, manager_id = ? WHERE employee_number = ?;
      `;

    db.query(
        sqlUpdate,
        [
            employeeName,
            employeeSurname,
            formattedBirthDate,
            employeeSalary,
            employeeRole,
            employeeEmail,
            employeeManager,
            employeeNumber

        ],
        (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.send(result);
            }
        }
    );
});

app.get("/api/employeeHierarchy", (req, res) => {
    const sqlHierarchy = `WITH RECURSIVE cte AS (
        SELECT
          employee_number,
          first_name,
          last_name,
          birth_date,
          salary,
          role,
          email,
          manager_id
        FROM ${process.env.DB_NAME}.Employee
        WHERE manager_id IS NULL
        UNION ALL
        SELECT
          e.employee_number,
          e.first_name,
          e.last_name,
          e.birth_date,
          e.salary,
          e.role,
          e.email,
          e.manager_id
        FROM ${process.env.DB_NAME}.Employee e
        INNER JOIN cte ON e.manager_id = cte.employee_number
      )
      
      
      SELECT * from cte`;

    db.query(sqlHierarchy, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: "An error occurred while fetching the employee hierarchy." });
        } else {
            res.json(result);
            console.log(result);
        }
    });
});





app.listen(process.env.BACKEND_PORT, () => {
    console.log(`running on port ${process.env.BACKEND_PORT}`);
})