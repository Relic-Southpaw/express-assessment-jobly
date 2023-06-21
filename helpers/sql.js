const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.


// this function takes the data that needs to be updated and writes the
// $1 and on for security.  then it maps it out and returns columns 
// and the values to be updated, which is plugged in an SQL query 
// which then updates the column name with the new values entered.
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  res = {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
  console.log(res)
  return res;
}

module.exports = { sqlForPartialUpdate };
