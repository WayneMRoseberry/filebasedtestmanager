const BaseModel = require('./BaseModel');

/**
 * TestSession data model for test session manifests
 */
class TestSession extends BaseModel {
  constructor(data = {}) {
    super(data, 'test-session');
    
    // Set up property accessors for convenience
    this._setupPropertyAccessors();
  }

  /**
   * Set up property accessors for direct property access
   */
  _setupPropertyAccessors() {
    const properties = [
      'id', 'projectId', 'charterId', 'date', 'startTime', 'endTime', 
      'duration', 'executor', 'notes', 'status', 'environment', 'build', 'metadata'
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
   * Get project ID
   * @returns {string} Project ID
   */
  getProjectId() {
    return this.get('projectId');
  }

  /**
   * Set project ID
   * @param {string} projectId - Project ID
   */
  setProjectId(projectId) {
    this.set('projectId', projectId);
  }

  /**
   * Get charter ID
   * @returns {string} Charter ID
   */
  getCharterId() {
    return this.get('charterId');
  }

  /**
   * Set charter ID
   * @param {string} charterId - Charter ID
   */
  setCharterId(charterId) {
    this.set('charterId', charterId);
  }

  /**
   * Get session date
   * @returns {string} Session date in YYYY-MM-DD format
   */
  getDate() {
    return this.get('date');
  }

  /**
   * Set session date
   * @param {string} date - Session date in YYYY-MM-DD format
   */
  setDate(date) {
    this.set('date', date);
  }

  /**
   * Get session start time
   * @returns {string|null} Start time in HH:MM:SS format or null
   */
  getStartTime() {
    return this.get('startTime');
  }

  /**
   * Set session start time
   * @param {string} startTime - Start time in HH:MM:SS format
   */
  setStartTime(startTime) {
    this.set('startTime', startTime);
  }

  /**
   * Get session end time
   * @returns {string|null} End time in HH:MM:SS format or null
   */
  getEndTime() {
    return this.get('endTime');
  }

  /**
   * Set session end time
   * @param {string} endTime - End time in HH:MM:SS format
   */
  setEndTime(endTime) {
    this.set('endTime', endTime);
  }

  /**
   * Get session duration
   * @returns {number|null} Duration in minutes or null
   */
  getDuration() {
    return this.get('duration');
  }

  /**
   * Set session duration
   * @param {number} duration - Duration in minutes
   */
  setDuration(duration) {
    this.set('duration', duration);
  }

  /**
   * Get session executor
   * @returns {string} Session executor name
   */
  getExecutor() {
    return this.get('executor');
  }

  /**
   * Set session executor
   * @param {string} executor - Session executor name
   */
  setExecutor(executor) {
    this.set('executor', executor);
  }

  /**
   * Get session notes
   * @returns {string|null} Session notes or null
   */
  getNotes() {
    return this.get('notes');
  }

  /**
   * Set session notes
   * @param {string} notes - Session notes
   */
  setNotes(notes) {
    this.set('notes', notes);
  }

  /**
   * Get session status
   * @returns {string|null} Session status or null
   */
  getStatus() {
    return this.get('status');
  }

  /**
   * Set session status
   * @param {string} status - Session status (planned, in-progress, completed, interrupted, cancelled)
   */
  setStatus(status) {
    this.set('status', status);
  }

  /**
   * Get testing environment
   * @returns {string|null} Testing environment or null
   */
  getEnvironment() {
    return this.get('environment');
  }

  /**
   * Set testing environment
   * @param {string} environment - Testing environment
   */
  setEnvironment(environment) {
    this.set('environment', environment);
  }

  /**
   * Get build version
   * @returns {string|null} Build version or null
   */
  getBuild() {
    return this.get('build');
  }

  /**
   * Set build version
   * @param {string} build - Build version
   */
  setBuild(build) {
    this.set('build', build);
  }

  /**
   * Get session metadata
   * @returns {Object} Metadata object
   */
  getMetadata() {
    return this.get('metadata') || {};
  }

  /**
   * Set session metadata
   * @param {Object} metadata - Metadata object
   */
  setMetadata(metadata) {
    this.set('metadata', metadata);
  }

  /**
   * Check if session is planned
   * @returns {boolean} True if session status is 'planned'
   */
  isPlanned() {
    return this.getStatus() === 'planned';
  }

  /**
   * Check if session is in progress
   * @returns {boolean} True if session status is 'in-progress'
   */
  isInProgress() {
    return this.getStatus() === 'in-progress';
  }

  /**
   * Check if session is completed
   * @returns {boolean} True if session status is 'completed'
   */
  isCompleted() {
    return this.getStatus() === 'completed';
  }

  /**
   * Check if session is interrupted
   * @returns {boolean} True if session status is 'interrupted'
   */
  isInterrupted() {
    return this.getStatus() === 'interrupted';
  }

  /**
   * Check if session is cancelled
   * @returns {boolean} True if session status is 'cancelled'
   */
  isCancelled() {
    return this.getStatus() === 'cancelled';
  }

  /**
   * Check if session is active (in-progress or completed)
   * @returns {boolean} True if session is active
   */
  isActive() {
    return this.isInProgress() || this.isCompleted();
  }

  /**
   * Get duration in hours
   * @returns {number|null} Duration in hours or null
   */
  getDurationInHours() {
    const duration = this.getDuration();
    return duration ? duration / 60 : null;
  }

  /**
   * Set duration in hours
   * @param {number} hours - Duration in hours
   */
  setDurationInHours(hours) {
    this.setDuration(hours * 60);
  }

  /**
   * Calculate duration from start and end times
   * @returns {number|null} Calculated duration in minutes or null
   */
  calculateDurationFromTimes() {
    const startTime = this.getStartTime();
    const endTime = this.getEndTime();
    
    if (!startTime || !endTime) {
      return null;
    }

    const start = this._parseTime(startTime);
    const end = this._parseTime(endTime);
    
    if (!start || !end) {
      return null;
    }

    const diffMs = end - start;
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Parse time string to Date object
   * @param {string} timeStr - Time string in HH:MM:SS format
   * @returns {Date|null} Date object or null
   */
  _parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
      return null;
    }

    const parts = timeStr.split(':');
    if (parts.length !== 3) {
      return null;
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      return null;
    }

    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    return date;
  }

  /**
   * Auto-calculate duration if start and end times are available
   */
  autoCalculateDuration() {
    const calculatedDuration = this.calculateDurationFromTimes();
    if (calculatedDuration !== null) {
      this.setDuration(calculatedDuration);
    }
  }

  /**
   * Check if session has timing information
   * @returns {boolean} True if session has start time or end time
   */
  hasTiming() {
    return !!(this.getStartTime() || this.getEndTime());
  }

  /**
   * Check if session has duration
   * @returns {boolean} True if session has duration set
   */
  hasDuration() {
    return this.getDuration() !== null && this.getDuration() > 0;
  }

  /**
   * Check if session has notes
   * @returns {boolean} True if session has notes
   */
  hasNotes() {
    return !!this.getNotes();
  }

  /**
   * Check if session has environment information
   * @returns {boolean} True if session has environment set
   */
  hasEnvironment() {
    return !!this.getEnvironment();
  }

  /**
   * Check if session has build information
   * @returns {boolean} True if session has build set
   */
  hasBuild() {
    return !!this.getBuild();
  }

  /**
   * Get session summary for display
   * @returns {Object} Session summary
   */
  getDisplaySummary() {
    return {
      id: this.getId(),
      projectId: this.getProjectId(),
      charterId: this.getCharterId(),
      date: this.getDate(),
      startTime: this.getStartTime(),
      endTime: this.getEndTime(),
      duration: this.getDuration(),
      durationHours: this.getDurationInHours(),
      executor: this.getExecutor(),
      status: this.getStatus(),
      environment: this.getEnvironment(),
      build: this.getBuild(),
      hasNotes: this.hasNotes(),
      hasTiming: this.hasTiming(),
      hasDuration: this.hasDuration(),
      isActive: this.isActive(),
      isValid: this.isValid(),
    };
  }

  /**
   * Check if session is ready for execution
   * @returns {boolean} True if session has executor and date
   */
  isReadyForExecution() {
    return !!this.getExecutor() && !!this.getDate();
  }

  /**
   * Get missing elements for execution
   * @returns {Array} Array of missing element names
   */
  getMissingExecutionElements() {
    const missing = [];
    
    if (!this.getExecutor()) {
      missing.push('executor');
    }
    
    if (!this.getDate()) {
      missing.push('date');
    }
    
    return missing;
  }
}

module.exports = TestSession;
