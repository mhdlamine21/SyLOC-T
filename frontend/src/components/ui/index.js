/**
 * Design system SyLOC-T - point d'entree unique des primitives.
 * Les styles sont dans src/styles/primitives.css, les tokens dans src/index.css.
 */
export { default as PageHeader } from './PageHeader';
export { default as Section } from './Section';
export { default as Toolbar } from './Toolbar';
export { default as StatCard } from './StatCard';
export { default as StatRow } from './StatRow';
export { default as DataTable } from './DataTable';
export { default as Badge, BADGE_TONES } from './Badge';
export { default as EmptyState } from './EmptyState';
export { default as Skeleton, SkeletonTable } from './Skeleton';
export { default as ConfirmDialog } from './ConfirmDialog';
export { ConfirmProvider, useConfirm } from './useConfirm';

// Primitives historiques conservees (formulaires, modale, mise en page).
export {
  Button,
  Card,
  Field,
  Input,
  Textarea,
  Select,
  StatusBadge,
  SectionHeader,
  PageWrapper,
  LoadingState,
  Modal,
  Table,
  Timeline,
  StarRating,
  AlertBanner,
} from '../common/ui';
