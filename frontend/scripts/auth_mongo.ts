import axios from 'axios';

const BASE_URL = 'http://localhost:3000/records';

/**
 * Fetches all records from the database.
 *
 * @returns {Promise<any[]>} A promise that resolves to an array of all records.
 * @throws Will throw an error if the request fails.
 */
export async function getAllRecords(): Promise<any[]> {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching all records:', error);
    throw error;
  }
}

/**
 * Fetches a single record by its ID.
 *
 * @param {string} id - The ID of the record to fetch.
 * @returns {Promise<any>} A promise that resolves to the record object.
 * @throws Will throw an error if the request fails or the record is not found.
 */
export async function getRecordById(id: string): Promise<any> {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching record with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Creates a new record in the database.
 *
 * @param {string} name - The name of the record.
 * @param {string} position - The position of the record.
 * @param {string} level - The level of the record.
 * @returns {Promise<void>} A promise that resolves when the record is successfully created.
 * @throws Will throw an error if the request fails.
 */
export async function createRecord(name: string, position: string, level: string): Promise<void> {
  try {
    const newRecord = { name, position, level };
    await axios.post(BASE_URL, newRecord);
  } catch (error) {
    console.error('Error creating new record:', error);
    throw error;
  }
}

/**
 * Updates an existing record in the database by its ID.
 *
 * @param {string} id - The ID of the record to update.
 * @param {string} name - The updated name of the record.
 * @param {string} position - The updated position of the record.
 * @param {string} level - The updated level of the record.
 * @returns {Promise<void>} A promise that resolves when the record is successfully updated.
 * @throws Will throw an error if the request fails.
 */
export async function updateRecord(id: string, name: string, position: string, level: string): Promise<void> {
  try {
    const updates = { name, position, level };
    await axios.patch(`${BASE_URL}/${id}`, updates);
  } catch (error) {
    console.error(`Error updating record with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes a record from the database by its ID.
 *
 * @param {string} id - The ID of the record to delete.
 * @returns {Promise<void>} A promise that resolves when the record is successfully deleted.
 * @throws Will throw an error if the request fails.
 */
export async function deleteRecord(id: string): Promise<void> {
  try {
    await axios.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting record with ID ${id}:`, error);
    throw error;
  }
}
