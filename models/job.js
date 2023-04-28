"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    static async create({ id, title, salary, equity, company_handle }) {
        const duplicateCheck = await db.query(
            `SELECT id
               FROM jobs
               WHERE id = $1`,
            [id]);

        if (duplicateCheck.rows[0])
            throw new BadRequestError(`Duplicate job: ${id}`);

        const result = await db.query(
            `INSERT INTO jobs
               (id, title, salary, equity, company_handle)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id, title, salary, equity, company_handle AS companyHandle`,
            [
                id,
                title,
                salary,
                equity,
                company_handle,
            ],
        );
        const job = result.rows[0];

        return job;
    }

    static async findAll(searchFilters = {}) {
        const query = await db.query(
            `SELECT id,
                      title,
                      salary,
                      equity",
                      company_handle AS companyHandle"
               FROM jobs
               ORDER BY title`);

        let whereExpressions = [];
        let queryValues = [];

        const { title, minSalary, hasEquity } = searchFilters;

        if (minSalary !== undefinded) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        }

        if (hasEquity === true) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        }
        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        // Finalize query and return results

        query += " ORDER BY title";
        const jobsRes = await db.query(query, queryValues);
        return jobsRes.rows;
    }



    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                      title,
                      salary,
                      equity",
                      company_handle AS companyHandle"
               FROM jobs
               WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }


    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                companyHanlde: "company_handle"
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, 
                                    title, 
                                    salary, 
                                    equity", 
                                    company_handle AS companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }


    static async remove(id) {
        const result = await db.query(
            `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;