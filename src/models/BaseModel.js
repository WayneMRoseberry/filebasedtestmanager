const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

/**
 * Base class for all data models with JSON schema validation
 */
class BaseModel {
  constructor(data = {}, schemaName = null) {
    this.data = { ...data };
    this.schemaName = schemaName;
    this.validationErrors = [];
    
    if (schemaName) {
      this.loadSchema();
    }
  }

  /**
   * Load the JSON schema for this model
   */
  loadSchema() {
    if (!this.schemaName) {
      throw new Error('Schema name is required');
    }

    const schemasDir = path.join(__dirname, '../../schemas');
    const schemaFile = path.join(schemasDir, `${this.schemaName}-schema.json`);
    
    if (!fs.existsSync(schemaFile)) {
      throw new Error(`Schema file not found: ${schemaFile}`);
    }

    this.schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
    
    // Initialize AJV validator
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.validator = this.ajv.compile(this.schema);
  }

  /**
   * Validate the model data against its schema
   * @returns {boolean} True if valid, false otherwise
   */
  isValid() {
    if (!this.validator) {
      return true; // No schema validation if no validator
    }

    const isValid = this.validator(this.data);
    this.validationErrors = this.validator.errors || [];
    return isValid;
  }

  /**
   * Get validation errors
   * @returns {Array} Array of validation error objects
   */
  getValidationErrors() {
    return this.validationErrors;
  }

  /**
   * Convert model to JSON object
   * @returns {Object} JSON representation of the model
   */
  toJSON() {
    return { ...this.data };
  }

  /**
   * Create model instance from JSON object
   * @param {Object} jsonData - JSON data to create model from
   * @returns {BaseModel} New model instance
   */
  static fromJSON(jsonData) {
    return new this(jsonData);
  }

  /**
   * Create model instance from manifest file data
   * @param {Object} manifestData - Manifest data to create model from
   * @returns {BaseModel} New model instance
   */
  static fromManifest(manifestData) {
    return new this(manifestData);
  }

  /**
   * Get a property value
   * @param {string} key - Property key
   * @returns {*} Property value
   */
  get(key) {
    return this.data[key];
  }

  /**
   * Set a property value
   * @param {string} key - Property key
   * @param {*} value - Property value
   */
  set(key, value) {
    this.data[key] = value;
  }

  /**
   * Check if a property exists
   * @param {string} key - Property key
   * @returns {boolean} True if property exists
   */
  has(key) {
    return key in this.data;
  }

  /**
   * Get all property keys
   * @returns {Array} Array of property keys
   */
  keys() {
    return Object.keys(this.data);
  }

  /**
   * Get all property values
   * @returns {Array} Array of property values
   */
  values() {
    return Object.values(this.data);
  }

  /**
   * Get all property entries
   * @returns {Array} Array of [key, value] pairs
   */
  entries() {
    return Object.entries(this.data);
  }

  /**
   * Update multiple properties at once
   * @param {Object} updates - Object containing property updates
   */
  update(updates) {
    Object.assign(this.data, updates);
  }

  /**
   * Clone the model instance
   * @returns {BaseModel} New model instance with same data
   */
  clone() {
    return new this.constructor({ ...this.data });
  }

  /**
   * Get model type name
   * @returns {string} Model type name
   */
  getModelType() {
    return this.constructor.name;
  }

  /**
   * Get model ID (if available)
   * @returns {string|null} Model ID or null
   */
  getId() {
    return this.data.id || null;
  }

  /**
   * Check if model has required fields
   * @returns {boolean} True if all required fields are present
   */
  hasRequiredFields() {
    if (!this.schema || !this.schema.required) {
      return true;
    }

    return this.schema.required.every(field => this.has(field));
  }

  /**
   * Get missing required fields
   * @returns {Array} Array of missing required field names
   */
  getMissingRequiredFields() {
    if (!this.schema || !this.schema.required) {
      return [];
    }

    return this.schema.required.filter(field => !this.has(field));
  }

  /**
   * Validate and throw error if invalid
   * @throws {Error} If model is invalid
   */
  validateOrThrow() {
    if (!this.isValid()) {
      const errors = this.getValidationErrors();
      const errorMessages = errors.map(error => 
        `${error.instancePath || 'root'}: ${error.message}`
      ).join(', ');
      
      throw new Error(`Model validation failed: ${errorMessages}`);
    }
  }

  /**
   * Get a summary of the model for logging/debugging
   * @returns {Object} Model summary
   */
  getSummary() {
    return {
      type: this.getModelType(),
      id: this.getId(),
      isValid: this.isValid(),
      validationErrors: this.getValidationErrors().length,
      hasRequiredFields: this.hasRequiredFields(),
      missingRequiredFields: this.getMissingRequiredFields(),
      propertyCount: Object.keys(this.data).length,
    };
  }
}

module.exports = BaseModel;
