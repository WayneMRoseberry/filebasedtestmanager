const BaseModel = require('./BaseModel');

/**
 * Project data model for test project manifests
 */
class Project extends BaseModel {
  constructor(data = {}) {
    super(data, 'project');
    
    // Set up property accessors for convenience
    this._setupPropertyAccessors();
  }

  /**
   * Set up property accessors for direct property access
   */
  _setupPropertyAccessors() {
    const properties = [
      'id', 'name', 'description', 'startDate', 'endDate', 'status', 
      'version', 'areaHierarchy', 'tags', 'metadata'
    ];

    properties.forEach(prop => {
      Object.defineProperty(this, prop, {
        get() {
          return this.get(prop);
        },
        set(value) {
          this.set(prop, value);
        },
        enumerable: true,
        configurable: true,
      });
    });
  }

  /**
   * Get project name
   * @returns {string} Project name
   */
  getName() {
    return this.get('name');
  }

  /**
   * Set project name
   * @param {string} name - Project name
   */
  setName(name) {
    this.set('name', name);
  }

  /**
   * Get project start date
   * @returns {string} Start date in YYYY-MM-DD format
   */
  getStartDate() {
    return this.get('startDate');
  }

  /**
   * Set project start date
   * @param {string} startDate - Start date in YYYY-MM-DD format
   */
  setStartDate(startDate) {
    this.set('startDate', startDate);
  }

  /**
   * Get project end date
   * @returns {string|null} End date in YYYY-MM-DD format or null
   */
  getEndDate() {
    return this.get('endDate');
  }

  /**
   * Set project end date
   * @param {string|null} endDate - End date in YYYY-MM-DD format or null
   */
  setEndDate(endDate) {
    this.set('endDate', endDate);
  }

  /**
   * Get project status
   * @returns {string|null} Project status or null
   */
  getStatus() {
    return this.get('status');
  }

  /**
   * Set project status
   * @param {string} status - Project status (active, archived, on-hold)
   */
  setStatus(status) {
    this.set('status', status);
  }

  /**
   * Get area hierarchy
   * @returns {Object} Area hierarchy object
   */
  getAreaHierarchy() {
    return this.get('areaHierarchy');
  }

  /**
   * Set area hierarchy
   * @param {Object} areaHierarchy - Area hierarchy object
   */
  setAreaHierarchy(areaHierarchy) {
    this.set('areaHierarchy', areaHierarchy);
  }

  /**
   * Get project tags
   * @returns {Array} Array of tags
   */
  getTags() {
    return this.get('tags') || [];
  }

  /**
   * Add a tag to the project
   * @param {string} tag - Tag to add
   */
  addTag(tag) {
    const tags = this.getTags();
    if (!tags.includes(tag)) {
      tags.push(tag);
      this.set('tags', tags);
    }
  }

  /**
   * Remove a tag from the project
   * @param {string} tag - Tag to remove
   */
  removeTag(tag) {
    const tags = this.getTags();
    const index = tags.indexOf(tag);
    if (index > -1) {
      tags.splice(index, 1);
      this.set('tags', tags);
    }
  }

  /**
   * Check if project has a specific tag
   * @param {string} tag - Tag to check
   * @returns {boolean} True if project has the tag
   */
  hasTag(tag) {
    return this.getTags().includes(tag);
  }

  /**
   * Get project metadata
   * @returns {Object} Metadata object
   */
  getMetadata() {
    return this.get('metadata') || {};
  }

  /**
   * Set project metadata
   * @param {Object} metadata - Metadata object
   */
  setMetadata(metadata) {
    this.set('metadata', metadata);
  }

  /**
   * Get a metadata value
   * @param {string} key - Metadata key
   * @returns {*} Metadata value
   */
  getMetadataValue(key) {
    return this.getMetadata()[key];
  }

  /**
   * Set a metadata value
   * @param {string} key - Metadata key
   * @param {*} value - Metadata value
   */
  setMetadataValue(key, value) {
    const metadata = this.getMetadata();
    metadata[key] = value;
    this.setMetadata(metadata);
  }

  /**
   * Get project version
   * @returns {string|null} Project version or null
   */
  getVersion() {
    return this.get('version');
  }

  /**
   * Set project version
   * @param {string} version - Project version (semver format)
   */
  setVersion(version) {
    this.set('version', version);
  }

  /**
   * Check if project is active
   * @returns {boolean} True if project status is 'active'
   */
  isActive() {
    return this.getStatus() === 'active';
  }

  /**
   * Check if project is archived
   * @returns {boolean} True if project status is 'archived'
   */
  isArchived() {
    return this.getStatus() === 'archived';
  }

  /**
   * Check if project is on hold
   * @returns {boolean} True if project status is 'on-hold'
   */
  isOnHold() {
    return this.getStatus() === 'on-hold';
  }

  /**
   * Get all feature names from area hierarchy
   * @returns {Array} Array of feature names
   */
  getFeatureNames() {
    const hierarchy = this.getAreaHierarchy();
    return hierarchy ? Object.keys(hierarchy) : [];
  }

  /**
   * Get sub-features for a specific feature
   * @param {string} featureName - Feature name
   * @returns {Array} Array of sub-feature names
   */
  getSubFeatures(featureName) {
    const hierarchy = this.getAreaHierarchy();
    if (!hierarchy || !hierarchy[featureName]) {
      return [];
    }
    return Object.keys(hierarchy[featureName]);
  }

  /**
   * Get components for a specific sub-feature
   * @param {string} featureName - Feature name
   * @param {string} subFeatureName - Sub-feature name
   * @returns {Array} Array of component names
   */
  getComponents(featureName, subFeatureName) {
    const hierarchy = this.getAreaHierarchy();
    if (!hierarchy || !hierarchy[featureName] || !hierarchy[featureName][subFeatureName]) {
      return [];
    }
    return hierarchy[featureName][subFeatureName];
  }

  /**
   * Add a feature to the area hierarchy
   * @param {string} featureName - Feature name
   * @param {Object} subFeatures - Sub-features object
   */
  addFeature(featureName, subFeatures = {}) {
    const hierarchy = this.getAreaHierarchy() || {};
    hierarchy[featureName] = subFeatures;
    this.setAreaHierarchy(hierarchy);
  }

  /**
   * Add a sub-feature to a feature
   * @param {string} featureName - Feature name
   * @param {string} subFeatureName - Sub-feature name
   * @param {Array} components - Array of components
   */
  addSubFeature(featureName, subFeatureName, components = []) {
    const hierarchy = this.getAreaHierarchy() || {};
    if (!hierarchy[featureName]) {
      hierarchy[featureName] = {};
    }
    hierarchy[featureName][subFeatureName] = components;
    this.setAreaHierarchy(hierarchy);
  }

  /**
   * Get project duration in days (if both start and end dates are available)
   * @returns {number|null} Duration in days or null
   */
  getDurationInDays() {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    
    if (!startDate || !endDate) {
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if project is currently running (between start and end dates)
   * @returns {boolean} True if project is currently running
   */
  isCurrentlyRunning() {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    
    if (!startDate) {
      return false;
    }

    const now = new Date();
    const start = new Date(startDate);
    
    if (start > now) {
      return false; // Project hasn't started yet
    }

    if (!endDate) {
      return true; // Project has no end date, so it's running
    }

    const end = new Date(endDate);
    return end >= now; // Project is running if end date hasn't passed
  }

  /**
   * Get project summary for display
   * @returns {Object} Project summary
   */
  getDisplaySummary() {
    return {
      id: this.getId(),
      name: this.getName(),
      status: this.getStatus(),
      version: this.getVersion(),
      startDate: this.getStartDate(),
      endDate: this.getEndDate(),
      duration: this.getDurationInDays(),
      isRunning: this.isCurrentlyRunning(),
      featureCount: this.getFeatureNames().length,
      tagCount: this.getTags().length,
      isValid: this.isValid(),
    };
  }
}

module.exports = Project;
