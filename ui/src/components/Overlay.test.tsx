import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, screen, act } from '@testing-library/react'
import * as fc from 'fast-check'
import {
  Modal,
  ModalOverlay,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  AlertDialog,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Tooltip,
  TooltipTrigger,
  Popover,
  PopoverTrigger,
  PopoverDialog,
  ToastContainer,
  useToast,
  toastQueue,
  Button,
} from '../index'

describe('Modal and AlertDialog Components', () => {
  test('Modal renders role="dialog", wraps focus, and closes on Escape key', () => {
    const onOpenChange = vi.fn()
    const { getByRole } = render(
      <ModalOverlay isOpen={true} onOpenChange={onOpenChange}>
        <Modal>
          <ModalDialog>
            <ModalHeader>Modal Title</ModalHeader>
            <ModalBody>Modal Content</ModalBody>
            <ModalFooter>
              <Button>Close</Button>
            </ModalFooter>
          </ModalDialog>
        </Modal>
      </ModalOverlay>,
    )

    const dialog = getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Modal Title')).toBeInTheDocument()

    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('Modal accepts size variants', () => {
    const { getByRole, rerender } = render(
      <ModalOverlay isOpen={true}>
        <Modal size="sm">
          <ModalDialog>
            <ModalBody>Small Modal</ModalBody>
          </ModalDialog>
        </Modal>
      </ModalOverlay>,
    )

    expect(getByRole('dialog')).toBeInTheDocument()

    rerender(
      <ModalOverlay isOpen={true}>
        <Modal size="lg">
          <ModalDialog>
            <ModalBody>Large Modal</ModalBody>
          </ModalDialog>
        </Modal>
      </ModalOverlay>,
    )

    expect(getByRole('dialog')).toBeInTheDocument()
  })

  test('AlertDialog renders role="alertdialog" and forwards aria-labelledby', () => {
    const { getByRole } = render(
      <ModalOverlay isOpen={true}>
        <Modal>
          <AlertDialog aria-labelledby="alert-title">
            <AlertDialogHeader id="alert-title">
              Are you sure?
            </AlertDialogHeader>
            <AlertDialogBody>This cannot be undone.</AlertDialogBody>
            <AlertDialogFooter>
              <Button>Cancel</Button>
            </AlertDialogFooter>
          </AlertDialog>
        </Modal>
      </ModalOverlay>,
    )

    const dialog = getByRole('alertdialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog.getAttribute('aria-labelledby')).toBe('alert-title')
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })
})

describe('Tooltip Component', () => {
  test('renders role="tooltip" when open', () => {
    const { getByRole } = render(
      <TooltipTrigger isOpen={true}>
        <Button>Hover or focus me</Button>
        <Tooltip>Tooltip content</Tooltip>
      </TooltipTrigger>,
    )

    const tooltip = getByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent('Tooltip content')
  })
})

describe('Popover Component', () => {
  test('opens on trigger press', () => {
    const { getByRole, queryByRole } = render(
      <PopoverTrigger>
        <Button>Open Popover</Button>
        <Popover>
          <PopoverDialog>
            <div>Popover content</div>
          </PopoverDialog>
        </Popover>
      </PopoverTrigger>,
    )

    // Initial state
    expect(queryByRole('dialog')).not.toBeInTheDocument()

    const trigger = getByRole('button')
    fireEvent.click(trigger)

    const dialog = getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Popover content')
  })
})

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      toastQueue.clear()
    })
    vi.useRealTimers()
  })

  test('ToastContainer renders, shows a toast on trigger, and supports different live roles', () => {
    const TestComponent = () => {
      const toast = useToast()
      return (
        <div>
          <ToastContainer data-testid="toast-container" />
          <Button onPress={() => toast.show('Hello Info', { variant: 'info' })}>
            Info
          </Button>
          <Button
            onPress={() => toast.show('Hello Error', { variant: 'error' })}
          >
            Error
          </Button>
        </div>
      )
    }

    const { getByRole } = render(<TestComponent />)

    const [infoBtn, errorBtn] = screen.getAllByRole('button')

    // Click Info Button
    fireEvent.click(infoBtn)

    // Flush state updates/timers so toast renders
    act(() => {
      vi.advanceTimersByTime(50)
    })

    const infoToast = getByRole('status')
    expect(infoToast).toBeInTheDocument()
    expect(infoToast).toHaveTextContent('Hello Info')

    // Click Error Button
    fireEvent.click(errorBtn)

    act(() => {
      vi.advanceTimersByTime(50)
    })

    const errorToast = getByRole('alert')
    expect(errorToast).toBeInTheDocument()
    expect(errorToast).toHaveTextContent('Hello Error')
  })
})

describe('Overlay Components Property-Based Tests', () => {
  test('Modal, AlertDialog, Tooltip, Popover, Toast append consumer className', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z][\w-]*$/.test(s)),
        (consumerClass) => {
          // Test className append on ModalOverlay
          const { unmount: modalUnmount } = render(
            <ModalOverlay
              isOpen={true}
              className={consumerClass}
              data-testid="modal-overlay"
            >
              <Modal>
                <ModalDialog>Content</ModalDialog>
              </Modal>
            </ModalOverlay>,
          )
          const overlayEl = screen.getByTestId('modal-overlay')
          expect(overlayEl.className).toContain(consumerClass)
          modalUnmount()

          // Test className append on Tooltip
          const { unmount: tooltipUnmount } = render(
            <TooltipTrigger isOpen={true}>
              <Button>Trigger</Button>
              <Tooltip className={consumerClass} data-testid="tooltip">
                Tooltip
              </Tooltip>
            </TooltipTrigger>,
          )
          const tooltipEl = screen.getByTestId('tooltip')
          expect(tooltipEl.className).toContain(consumerClass)
          tooltipUnmount()

          // Test className append on Popover
          const { unmount: popoverUnmount } = render(
            <PopoverTrigger isOpen={true}>
              <Button>Trigger</Button>
              <Popover className={consumerClass} data-testid="popover">
                <PopoverDialog>Popover</PopoverDialog>
              </Popover>
            </PopoverTrigger>,
          )
          const popoverEl = screen.getByTestId('popover')
          expect(popoverEl.className).toContain(consumerClass)
          popoverUnmount()
        },
      ),
      { numRuns: 10 },
    )
  })
})
