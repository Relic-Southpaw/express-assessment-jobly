const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { isAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");