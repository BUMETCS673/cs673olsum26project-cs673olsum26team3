## Overview
Our goal is to develop a web-based application where users can provide context in the form of PDFs, API specs, and feature documents, and then have the AI generate targeted test cases when a user story is submitted. The system stores the uploaded knowledge persistently using a vector database so that it can be retrieved and used as grounded context at generation time, rather than relying on the AI to guess at product behavior it has never seen.


## Motivation
Help software companies reduce the time and manual effort spent creating test cases and validating product features.

## Purpose
Automatically generate functional, negative, and edge case test cases from product documentation to improve software quality and provide early feedback on features.

## Potential Users
Software companies, including developers, QA engineers, and product teams.

## Basic Functionality
Users upload product documents (PDFs, API specs, etc.), and the system uses AI to analyze them and generate test cases from a given user story.

## Technology Stack
The system will be built using Django for the backend and web interface, MongoDB as the database, and Jira for agile project management. AI/ML tools will be integrated to enable automated document processing and natural language understanding for test case generation. 
