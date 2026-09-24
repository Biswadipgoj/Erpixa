// Maps the free-text status values stored on records to a badge tone,
// so every module colours the same word the same way.

export function statusTone(status: string): string {
  switch (status) {
    case 'Confirmed': case 'Done': case 'Completed': case 'Paid': case 'Active': case 'Resolved': case 'In Stock':
      return 'badge-success';
    case 'In Progress': case 'Posted': case 'Invoiced':
      return 'badge-accent badge-live';
    case 'Draft': case 'Planned': case 'Planning': case 'Open':
      return 'badge-neutral';
    case 'On Hold': case 'Paused': case 'Low Stock': case 'On Leave': case 'Unpaid': case 'High':
      return 'badge-warning';
    case 'Cancelled': case 'Out of Stock': case 'Terminated': case 'Overdue': case 'Urgent':
      return 'badge-danger';
    case 'Medium':
      return 'badge-info';
    default:
      return 'badge-neutral';
  }
}
