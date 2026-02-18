/**
 * Dashboard Components Index
 * 
 * This file provides convenient re-exports of all dashboard components
 * organized by user role.
 * 
 * Folder Structure:
 * - shared/     : Components used across all roles
 * - requester/  : Components for project creators
 * - collector/  : Components for data collectors  
 * - agent/      : Components for validators
 * - admin/      : Components for administrators
 */

// Shared Components
export * from "./shared";

// Requester Components
export * from "./requester";

// Collector Components
export * from "./collector";

// Agent Components
export * from "./agent";

// Admin Components
export * from "./admin";
