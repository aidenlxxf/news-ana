/**
 * DTO for refresh task response
 */
export interface RefreshTaskResponseDto {
  /**
   * Task ID that was refreshed
   */
  taskId: string;
  
  /**
   * Success message
   */
  message: string;
}
