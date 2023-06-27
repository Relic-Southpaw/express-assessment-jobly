const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { isAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = express.Router();

// "/"  GET request:
//returns list of jobs
//  {
//  id,
//  title,
//  salary,
//  equity,
//  companyHandle,
//  companyName
//}
//has options to filter by title, minSalary, and hasEquity
//title can find part of title and casing doesn't matter for search
//hasEquity: if true, filter to jobs that provide a non-zero amount of equity. 
//  If false or not included in the filtering, list all jobs regardless of equity.

//open for all, no authorization needed.

router.get("/", async function (req, res, next) {
    let q = req.query
    try {
        const validator = jsonschema.validate(q, jobSearchSchema)
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const jobs = await Job.findAll(q)
        return res.json({ jobs });
    } catch (err) {
        return next(err)
    }
})

// "/" Post for jobs
// adds a job
//job is {title, salary, equity, companyHandle}
// returns job with an id as well

//Authorization level is Admin
router.post("/", isAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema)
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body)
        return res.status(201).json({ job });

    } catch (err) {
        return next(err);
    }
});

// Get request by ID
// gets specific job with ID and returns the job

//No specific Authorization required. Open to all.
router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

//"/:id" PATCH Job
//finds job by ID
//if data to be updated is validated by the schema, will update

//Authorization Level: Admin only
router.patch("/:id", isAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

// DELETE job by "id"
//pretty straight forward, removes from database when delete request is made
//returns that it was deleted

//Auth Required: Admin only
router.delete("/:id", isAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id })

    } catch (err) {
        return next(err);
    }
});

module.export = router;