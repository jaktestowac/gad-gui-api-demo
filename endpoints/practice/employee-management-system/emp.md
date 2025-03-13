# 🏢 Employee Management System

This document outlines the data structure and REST API endpoints for an **Employee Management System**. The system includes complex nested entities and hierarchical relationships to enable comprehensive UI and REST API testing.

---

## 🗄️ Data Structure

### 1. **Employee** (Primary entity)

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "personalInfo": {
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "address": {
      "street": "123 Tech Lane",
      "city": "Silicon Valley",
      "state": "CA",
      "zipCode": "94025",
      "country": "USA"
    },
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+1-555-987-6543"
    }
  },
  "employmentDetails": {
    "position": "Software Engineer",
    "department": {
      "id": 101,
      "name": "Engineering"
    },
    "manager": {
      "id": 2,
      "name": "Jane Smith"
    },
    "permissions": ["READ", "UPDATE"],
    "compensation": {
      "salary": {
        "base": 5000,
        "bonus": 1000,
        "currency": "USD"
      },
      "benefits": {
        "healthInsurance": true,
        "dentalInsurance": true,
        "stockOptions": 1000
      }
    },
    "dates": {
      "hired": "2022-03-15",
      "startedRole": "2022-03-20",
      "nextReview": "2024-03-15"
    }
  },
  "performance": {
    "rating": 4.5,
    "lastReviewDate": "2023-03-15",
    "skills": ["JavaScript", "Node.js", "React"],
    "certifications": [
      {
        "name": "AWS Certified Developer",
        "issueDate": "2023-01-15",
        "expiryDate": "2026-01-15"
      }
    ]
  },
  "attendance": [
    {
      "date": "2025-03-01",
      "status": "PRESENT",
      "hoursWorked": 8
    },
    {
      "date": "2025-03-02",
      "status": "ABSENT",
      "reason": "Sick leave"
    }
  ]
}
```

✅ **Complexity Features**:

- Deep nesting with multiple levels of objects and arrays
- Composite relationships through manager and department references
- Varying data types including strings, numbers, booleans, dates
- Optional and required fields at different nesting levels
- Complex validation rules for nested properties

### 2. **Department**

```json
{
  "id": 101,
  "name": "Engineering",
  "parentDepartmentId": null,
  "subDepartments": [
    {
      "id": 102,
      "name": "Backend Team",
      "parentDepartmentId": 101
    },
    {
      "id": 103,
      "name": "Frontend Team",
      "parentDepartmentId": 101
    }
  ]
}
```

✅ **Complexity Features**:

- Hierarchical department structure with parent-child relationships
- Nested subdepartments allow for complex organizational structures

### 3. **Role/Permission**

```json
{
  "id": 1,
  "role": "Manager",
  "permissions": ["CREATE", "UPDATE", "DELETE", "VIEW"]
}
```

✅ **Complexity Features**:

- Each role has an array of permissions
- Permissions are used to control access to API endpoints

### 4. **Attendance Record**

```json
{
  "id": 1,
  "employeeId": 1,
  "date": "2025-03-01",
  "status": "PRESENT",
  "hoursWorked": 8
}
```

```json
{
  "id": 2,
  "employeeId": 1,
  "date": "2025-03-02",
  "status": "ABSENT",
  "reason": "Sick leave"
}
```

✅ **Complexity Features**:

- Different fields based on status type (PRESENT vs ABSENT)
- Date validation and time period constraints

### 5. **Authentication**

```json
{
  "token": "token-1-1678901234567",
  "userId": 1,
  "username": "admin"
}
```

✅ **Complexity Features**:

- Token-based authentication
- Permission checking middleware
- Role-based access control

---

## 🌐 API Endpoints

### **Authentication Flow**

1. **Login Process**:

   - **POST** `/api/practice/v1/auth/login` with credentials:
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```
   - Response includes token:
     ```json
     {
       "token": "token-1-1678901234567",
       "userId": 1,
       "username": "admin"
     }
     ```

2. **Using Authentication**:

   - Include token in all subsequent requests:
     ```
     Authorization: Bearer token-1-1678901234567
     ```

3. **Permission Checking**:

   - Each endpoint checks if the user has the required permission:
     - `CREATE` for POST operations
     - `UPDATE` for PUT operations
     - `DELETE` for DELETE operations
     - `VIEW` for GET operations

4. **Get Current Permissions**:

   - **GET** `/api/practice/v1/auth/permissions` returns:
     ```json
     {
       "userId": 1,
       "username": "admin",
       "permissions": ["CREATE", "UPDATE", "DELETE", "VIEW"]
     }
     ```

5. **Logout**:
   - **POST** `/api/practice/v1/auth/logout` invalidates the token

---

### **Employee Endpoints**

- **POST** `/api/practice/v1/employees` – Create a new employee

  - Required permissions: `CREATE`
  - Request body:
    ```json
    {
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice.johnson@example.com",
      "position": "UX Designer",
      "departmentId": 103,
      "managerId": 2,
      "permissions": ["VIEW"],
      "salary": {
        "base": 4500,
        "bonus": 800,
        "currency": "USD"
      },
      "hireDate": "2023-05-20"
    }
    ```
  - Response: Created employee with assigned ID

- **GET** `/api/practice/v1/employees` – Get a list of all employees

  - Required permissions: `VIEW`
  - Supports query parameters:
    - `departmentId`: Filter by department
    - `managerId`: Filter by manager
    - `role`: Filter by permission/role

- **GET** `/api/practice/v1/employees/1` – Get details of a specific employee

  - Required permissions: `VIEW`
  - Response includes full employee data with attendance records

- **PUT** `/api/practice/v1/employees/1` – Update employee details

  - Required permissions: `UPDATE`
  - Validation prevents circular manager relationships
  - Request body: Full employee object with updated fields

- **DELETE** `/api/practice/v1/employees/1` – Delete employee record
  - Required permissions: `DELETE`
  - Cannot delete employees who are managers for others

---

### **Department Endpoints**

- **POST** `/api/practice/v1/departments` – Create a new department

  - Required permissions: `CREATE`
  - Request body:
    ```json
    {
      "name": "Quality Assurance",
      "parentDepartmentId": 101
    }
    ```
  - Response: Created department with assigned ID

- **GET** `/api/practice/v1/departments` – Get all departments

  - Required permissions: `VIEW`
  - Response includes nested sub-departments

- **GET** `/api/practice/v1/departments/101` – Get details of a specific department

  - Required permissions: `VIEW`
  - Response includes nested sub-departments

- **PUT** `/api/practice/v1/departments/101` – Update department details

  - Required permissions: `UPDATE`
  - Validation ensures no cyclic dependencies in department hierarchy
  - Request body: Department object with updated fields

- **DELETE** `/api/practice/v1/departments/101` – Delete department
  - Required permissions: `DELETE`
  - Cannot delete departments containing active employees

---

### **Role Endpoints**

- **POST** `/api/practice/v1/roles` – Create a new role

  - Required permissions: `CREATE`
  - Request body:
    ```json
    {
      "role": "Team Lead",
      "permissions": ["CREATE", "UPDATE", "VIEW"]
    }
    ```
  - Ensures unique role name
  - Response: Created role with assigned ID

- **GET** `/api/practice/v1/roles` – Get all roles

  - Required permissions: `VIEW`
  - Response includes all roles with their permissions

- **PUT** `/api/practice/v1/roles/1` – Update role

  - Required permissions: `UPDATE`
  - Request body: Role object with updated fields

- **DELETE** `/api/practice/v1/roles/1` – Delete role
  - Required permissions: `DELETE`
  - Should check if employees are assigned this role (not implemented in demo)

---

### **Attendance Endpoints**

- **POST** `/api/practice/v1/attendance` – Create an attendance record

  - Required permissions: `CREATE`
  - Request body for present status:
    ```json
    {
      "employeeId": 1,
      "date": "2025-03-03",
      "status": "PRESENT",
      "hoursWorked": 7.5
    }
    ```
  - Request body for absent status:
    ```json
    {
      "employeeId": 1,
      "date": "2025-03-04",
      "status": "ABSENT",
      "reason": "Personal leave"
    }
    ```
  - Response: Created attendance record with assigned ID

- **GET** `/api/practice/v1/attendance?employeeId=1` – Get attendance for an employee

  - Required permissions: `VIEW`
  - Supports query parameters:
    - `employeeId`: Filter by employee
    - `startDate`: Filter by start date
    - `endDate`: Filter by end date

- **PUT** `/api/practice/v1/attendance/1` – Update attendance record

  - Required permissions: `UPDATE`
  - Cannot modify past records
  - Request body: Attendance record with updated fields

- **DELETE** `/api/practice/v1/attendance/1` – Delete attendance record
  - Required permissions: `DELETE`
  - Cannot delete past records

---

## 🧪 Testing the API

### Example Workflow

1. **Login as Admin**:

   ```bash
   curl -X POST http://localhost:3000/api/practice/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

   Save the returned token for subsequent requests.

2. **Create a New Department**:

   ```bash
   curl -X POST http://localhost:3000/api/practice/v1/departments \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"name":"Mobile Development","parentDepartmentId":101}'
   ```

3. **Create a New Employee**:

   ```bash
   curl -X POST http://localhost:3000/api/practice/v1/employees \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"firstName":"James","lastName":"Wilson","email":"james@example.com","position":"Mobile Developer","departmentId":104,"managerId":2,"permissions":["VIEW"],"salary":{"base":4800,"bonus":900,"currency":"USD"},"hireDate":"2023-06-15"}'
   ```

4. **Add Attendance for the New Employee**:

   ```bash
   curl -X POST http://localhost:3000/api/practice/v1/attendance \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"employeeId":3,"date":"2025-03-10","status":"PRESENT","hoursWorked":8}'
   ```

5. **View All Employees**:

   ```bash
   curl -X GET http://localhost:3000/api/practice/v1/employees \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

6. **Test Permission Restrictions (Login as Regular User)**:

   ```bash
   curl -X POST http://localhost:3000/api/practice/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"user","password":"user123"}'
   ```

   Try to delete an employee (should fail with permission denied):

   ```bash
   curl -X DELETE http://localhost:3000/api/practice/v1/employees/1 \
     -H "Authorization: Bearer USER_TOKEN"
   ```

---

## 🔄 Common Error Responses

- **401 Unauthorized**: Authentication required or invalid token

  ```json
  { "error": "Authentication required. Please log in." }
  ```

- **403 Forbidden**: Insufficient permissions

  ```json
  { "error": "Permission denied: 'DELETE' permission required" }
  ```

- **400 Bad Request**: Validation errors

  ```json
  { "error": "Email already exists" }
  ```

- **404 Not Found**: Resource not found

  ```json
  { "error": "Employee not found" }
  ```

- **409 Conflict**: Business rule violations
  ```json
  { "error": "Circular manager relationship detected" }
  ```
