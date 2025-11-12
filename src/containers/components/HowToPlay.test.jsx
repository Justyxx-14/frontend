import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock framer-motion for simpler testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left">←</div>,
  ArrowRight: () => <div data-testid="arrow-right">→</div>,
  X: () => <div data-testid="close-icon">×</div>,
}));

// Import after mocks
import HowToPlayModal from './HowToPlay';

describe('HowToPlayModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the modal when isOpen is true', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByAltText('Rule Page 1')).toBeDefined();
  });

  it('should not render the modal when isOpen is false', () => {
    render(<HowToPlayModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should call onClose when close button is clicked', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('should navigate to next slide', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    const nextButton = screen.getByLabelText('Next');
    fireEvent.click(nextButton);
    
    expect(screen.getByAltText(/Rule Page/)).toBeDefined();
  });

  it('should navigate to previous slide', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    // First go to slide 2
    const nextButton = screen.getByLabelText('Next');
    fireEvent.click(nextButton);
    
    // Then go back to slide 1
    const prevButton = screen.getByLabelText('Previous');
    fireEvent.click(prevButton);
    
    expect(screen.getByAltText('Rule Page 1')).toBeDefined();
  });

  it('should navigate cyclically through slides', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    const nextButton = screen.getByLabelText('Next');
    const prevButton = screen.getByLabelText('Previous');
    
    // Test cyclic functionality by going to last slide
    const totalSlides = 14;
    
    // Go to last slide
    for(let i = 1; i < totalSlides; i++) {
      fireEvent.click(nextButton);
    }
    
    // Verify we're on the last slide
    expect(screen.getByAltText(`Rule Page ${totalSlides}`)).toBeDefined();
    
    // Next click should return to first slide
    fireEvent.click(nextButton);
    expect(screen.getByAltText('Rule Page 1')).toBeDefined();
    
    // Previous click should go to last slide
    fireEvent.click(prevButton);
    expect(screen.getByAltText(`Rule Page ${totalSlides}`)).toBeDefined();
  });

  it('should display slide indicators', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    const container = screen.getByRole('dialog');
    const indicators = container.querySelectorAll('[class*="rounded-full"]');
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('should activate zoom when image is clicked', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    const image = screen.getByAltText(/Rule Page/);
    fireEvent.click(image);
    
    // Verify zoomed image is displayed
    expect(screen.getByAltText(/Rule Page.*zoom/)).toBeDefined();
  });

  it('should close zoom when overlay is clicked', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    // Activate zoom
    const image = screen.getByAltText(/Rule Page/);
    fireEvent.click(image);
    
    // Close zoom by clicking overlay
    const zoomImage = screen.getByAltText(/Rule Page.*zoom/);
    const zoomOverlay = zoomImage.closest('div');
    fireEvent.click(zoomOverlay);
    
    expect(screen.queryByAltText(/Rule Page.*zoom/)).toBeNull();
  });

  it('should handle Escape key to close modal', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('should handle Escape key to close zoom first', () => {
    render(<HowToPlayModal {...defaultProps} />);
    
    // Activate zoom
    const image = screen.getByAltText(/Rule Page/);
    fireEvent.click(image);
    
    // Escape should close zoom, not modal
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(screen.queryByAltText(/Rule Page.*zoom/)).toBeNull();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should reset to first slide when modal is closed and reopened', () => {
    const { rerender } = render(<HowToPlayModal {...defaultProps} />);
    
    // Navigate to a different slide
    const nextButton = screen.getByLabelText('Next');
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    
    // Close modal
    rerender(<HowToPlayModal {...defaultProps} isOpen={false} />);
    
    // Reopen modal
    rerender(<HowToPlayModal {...defaultProps} isOpen={true} />);
    
    // Should be back on first slide
    expect(screen.getByAltText('Rule Page 1')).toBeDefined();
  });
});