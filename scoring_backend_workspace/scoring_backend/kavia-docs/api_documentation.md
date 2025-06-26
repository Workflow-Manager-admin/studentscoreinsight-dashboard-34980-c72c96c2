# Student Score Insight API – Backend Route Documentation

This API handles backend data management, authentication, analytics, and health checks for the Student Score Insight Dashboard via a RESTful interface powered by FastAPI. All endpoints, request/response formats, security, and sample payloads are documented below.

---
## Authentication

| Security           | Scheme    | Route Usage      |
|--------------------|-----------|------------------|
| Bearer JWT tokens  | OAuth2    | All routes except `/auth/token`, `/auth/register`, `/`, and `/health` require authentication. See below for details.|

To access most endpoints, a valid Bearer token (JWT) must be provided in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained via the `/auth/token` endpoint (see below).

---

## Route Reference

### Root & Health Check

- **GET /**  
  _Summary_: Basic service health check  
  _Auth_: None  
  _Response_:  
  ```json
  {"message": "Healthy API up & running."}
  ```

- **GET /health**  
  _Summary_: Database health check  
  _Auth_: None  
  _Response (success)_:  
  ```json
  {"status": "ok", "detail": "Database reachable."}
  ```  
  _Response (error)_:
  ```json
  {"status": "error", "detail": "...exception text..."}
  ```

---

### Authentication Endpoints

- **POST /auth/token**  
  _Summary_: Obtain access token  
  _Auth_: None  
  _Request (form)_:

    - `username` (str)
    - `password` (str)

  Example cURL:
  ```
  curl -X POST -F "username=admin" -F "password=admin123" http://<host>/auth/token
  ```
  _Response_:
  ```json
  {
    "access_token": "<jwt_token_here>",
    "token_type": "bearer"
  }
  ```

- **POST /auth/register**  
  _Summary_: Register new admin user (demo)  
  _Auth_: None  
  _Request (JSON)_:
  ```json
  {
    "username": "newadmin",
    "password": "yourpassword"
  }
  ```
  _Response (Example)_:
  ```json
  {
    "id": 0,
    "name": "admin",
    "student_number": "admin",
    "email": "admin@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
  ```
  _Note_: This endpoint is only for demonstration and should not be used for general registration in production.

---

### Student Management

All endpoints below require Bearer token authentication.

- **POST /students**  
  _Summary_: Create student  
  _Request_:
  ```json
  {
    "name": "Jane Doe",
    "student_number": "S10001",
    "email": "janedoe@email.com"
  }
  ```
  _Response_:
  ```json
  {
    "id": 1,
    "name": "Jane Doe",
    "student_number": "S10001",
    "email": "janedoe@email.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
  ```
  _Errors_:
    - `400`: Student number already exists

- **GET /students**
  - _Summary_: List students (supports pagination via `skip` and `limit` query params)
  - _Response_:  
    ```json
    [
      {
        "id": 1,
        "name": "Jane Doe",
        "student_number": "S10001",
        "email": "janedoe@email.com",
        "created_at": "2024-01-01T00:00:00Z"
      }
      // ...more students
    ]
    ```

- **GET /students/{student_id}**
  - _Summary_: Get student by ID
  - _Response_: as above for individual
  - _Errors_:
      - `404`: Student not found

- **PUT /students/{student_id}**
  - _Summary_: Update student information
  - _Request (partial)_:
    ```json
    {
      "name": "Jane Smith",
      "email": "jane2@email.com"
    }
    ```
  - _Response_: updated student object
  - _Errors_:
      - `404`: Student not found

- **DELETE /students/{student_id}**
  - _Summary_: Delete student record
  - _Response_: HTTP 204 +  
    ```json
    {"detail": "Deleted."}
    ```
  - _Errors_:
      - `404`: Student not found

---

### Score Management

All endpoints below require Bearer token authentication.

- **POST /scores**
  - _Summary_: Add new score for a student
  - _Request_:
    ```json
    {
      "student_id": 1,
      "subject": "Math",
      "value": 89.5,
      "max_value": 100
    }
    ```
  - _Response_:
    ```json
    {
      "id": 5,
      "student_id": 1,
      "subject": "Math",
      "value": 89.5,
      "max_value": 100,
      "date": "2024-01-01T00:00:00Z"
    }
    ```
  - _Errors_:
      - `400`: Student does not exist

- **GET /scores**
  - _Summary_: List all scores (supports pagination via `skip` and `limit`)
  - _Response_:  
    ```json
    [
      {
        "id": 5,
        "student_id": 1,
        "subject": "Math",
        "value": 89.5,
        "max_value": 100,
        "date": "2024-01-01T00:00:00Z"
      }
      // ...more scores
    ]
    ```

- **GET /scores/{score_id}**
  - _Summary_: Get score by its ID
  - _Response_: Single score object as above
  - _Errors_:
      - `404`: Score not found

- **PUT /scores/{score_id}**
  - _Summary_: Update score information
  - _Request (partial)_:
    ```json
    {
      "value": 91.0
    }
    ```
  - _Response_: Score object updated
  - _Errors_:
      - `404`: Score not found

- **DELETE /scores/{score_id}**
  - _Summary_: Delete a score record
  - _Response_: HTTP 204 +  
    ```json
    {"detail": "Deleted."}
    ```
  - _Errors_:
      - `404`: Score not found

---

### Analytics Endpoints

All endpoints below require Bearer token authentication.

- **GET /analytics/summary**
  - _Summary_: Dashboard summary analytics (totals, averages, top performers)
  - _Response_:
    ```json
    {
      "total_students": 100,
      "total_scores": 500,
      "avg_score_overall": 79.1,
      "top_student": "Jane Doe",
      "top_subject": "Math"
    }
    ```

- **GET /analytics/students/{student_id}/performance**
  - _Summary_: Student performance analytics
  - _Response_:
    ```json
    {
      "student_id": 1,
      "name": "Jane Doe",
      "avg_score": 92.0,
      "scores": [
        {
          "id": 10,
          "student_id": 1,
          "subject": "Math",
          "value": 92.0,
          "max_value": 100,
          "date": "2024-01-01T00:00:00Z"
        }
        // ...more scores
      ]
    }
    ```
  - _Errors_:
      - `404`: Student not found

- **GET /analytics/trends/subject**
  - _Summary_: Subject trend analytics for average score per test date
  - _Query Param_: `subject` (str; required)
  - _Response_:
    ```json
    [
      {
        "subject": "Math",
        "date": "2024-02-21T00:00:00Z",
        "avg_score": 78.2
      }
      // ...one per date
    ]
    ```

- **GET /analytics/distribution/subject**
  - _Summary_: Histogram distribution for subject scores
  - _Query Param_: `subject` (str; required)
  - _Response_:
    ```json
    {
      "bins": [0, 20, 40, 60, 80, 100],
      "counts": [2, 10, 14, 18, 6]
    }
    ```
  - _Note_: Bins are dynamically computed for given data. If no scores exist for subject, bins and counts will all be zero.

---

## Notes

- All date fields are returned as ISO8601 strings.
- All endpoints that create or update resources expect and return JSON unless otherwise noted.
- Most endpoints return HTTP 401 if request lacks/has invalid authentication.

---

## Error Handling Example

- Authentication error:
  ```
  HTTP 401 Unauthorized
  {
    "detail": "Could not validate credentials."
  }
  ```

---

## See Also

- For full schema including nested objects and example values, see `/docs` (FastAPI Swagger UI) when running the backend.
