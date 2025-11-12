# React + Vite Project Setup and Testing Guide

## Setup

### Install Dependencies

In the project directory, run:

```
npm install
```

This command installs all required packages defined in `package.json`.

## Development

### Run the Development Server

To start the application with hot-reloading, run:

```
npm run dev
```

The application will typically run at `http://localhost:5173`, unless that port is already in use.

## Testing

### Run Tests in Watch Mode with UI

Execute the following command to run tests using Vitest in watch mode with UI:

```
npm run test:v8:watch
```

This command uses the V8 coverage provider and enables re-running tests when files change.

### Run Tests with Coverage Report

To run all tests once and generate a coverage report, run:

```
npm test -- --coverage
```

The coverage report is typically generated inside a `coverage/` directory.
