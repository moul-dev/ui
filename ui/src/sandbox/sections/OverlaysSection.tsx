import * as stylex from '@stylexjs/stylex'
import type React from 'react'
import { useState } from 'react'
import { DialogTrigger } from 'react-aria-components'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerDialog,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  type DrawerPlacement,
  type DrawerSize,
  DrawerTitle,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  Tooltip,
  TooltipTrigger,
} from '../../index'
import { tokens } from '../../tokens/tokens.stylex'

const styles = stylex.create({
  card: {
    backgroundColor: tokens.colorBgGlass,
    borderColor: tokens.colorBorderSubtle,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: tokens.radiusLg,
    padding: tokens.spacing8,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: tokens.shadowSm,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing7,
    boxSizing: 'border-box',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing4,
    width: '100%',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFgSubtle,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorderSubtle,
    paddingBottom: tokens.spacing2,
    margin: 0,
  },
  buttonGroup: {
    display: 'flex',
    gap: tokens.spacing4,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
})

interface OverlaysSectionProps {
  onOpenCommandPalette?: () => void
}

export const OverlaysSection: React.FC<OverlaysSectionProps> = ({
  onOpenCommandPalette,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerPlacement, setDrawerPlacement] =
    useState<DrawerPlacement>('right')
  const [drawerSize, setDrawerSize] = useState<DrawerSize>('md')
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false)

  const openDrawer = (
    placement: DrawerPlacement = 'right',
    size: DrawerSize = 'md',
  ) => {
    setDrawerPlacement(placement)
    setDrawerSize(size)
    setIsDrawerOpen(true)
  }

  return (
    <div {...stylex.props(styles.card)}>
      {/* Sliding Drawers */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Multi-Directional Drawers
        </h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button variant="primary" onPress={() => openDrawer('right', 'md')}>
            Open Right Drawer (600px)
          </Button>
          <Button variant="secondary" onPress={() => openDrawer('left', 'md')}>
            Open Left Drawer
          </Button>
          <Button
            variant="secondary"
            onPress={() => openDrawer('bottom', 'md')}
          >
            Open Bottom Sheet
          </Button>
          <Button variant="secondary" onPress={() => openDrawer('top', 'sm')}>
            Open Top Drawer
          </Button>
        </div>
      </section>

      {/* Modals & Dialogs */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Modals & Alert Dialogs</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          {/* Confirmation Modal */}
          <DialogTrigger>
            <Button variant="danger">Delete Account (Alert Dialog)</Button>
            <ModalOverlay>
              <Modal>
                <AlertDialog>
                  {({ close }) => (
                    <>
                      <AlertDialogHeader>Delete Account</AlertDialogHeader>
                      <AlertDialogBody>
                        Are you sure you want to delete your account? This
                        action cannot be undone and all of your data will be
                        permanently removed.
                      </AlertDialogBody>
                      <AlertDialogFooter>
                        <Button variant="secondary" onPress={close}>
                          Cancel
                        </Button>
                        <Button variant="danger" onPress={close}>
                          Delete
                        </Button>
                      </AlertDialogFooter>
                    </>
                  )}
                </AlertDialog>
              </Modal>
            </ModalOverlay>
          </DialogTrigger>

          {/* Standard Modal */}
          <Button variant="outline" onPress={() => setIsBasicModalOpen(true)}>
            Open Standard Modal
          </Button>

          {onOpenCommandPalette && (
            <Button variant="secondary" onPress={onOpenCommandPalette}>
              Open Command Palette (⌘K)
            </Button>
          )}
        </div>
      </section>

      {/* Popovers and Tooltips */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Popovers & Tooltips</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <DialogTrigger>
            <Button variant="secondary">Open Popover</Button>
            <Popover>
              <div style={{ padding: '16px', maxWidth: '260px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                  Popover Details
                </h4>
                <p style={{ margin: 0, fontSize: '0.8125rem', opacity: 0.8 }}>
                  This popover floats above the page and aligns dynamically to
                  its trigger.
                </p>
              </div>
            </Popover>
          </DialogTrigger>

          <TooltipTrigger>
            <Button variant="ghost">Hover for Tooltip</Button>
            <Tooltip>Instant keyboard & mouse accessible tooltip</Tooltip>
          </TooltipTrigger>
        </div>
      </section>

      {/* Drawer Overlay */}
      <DrawerOverlay
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        placement={drawerPlacement}
        size={drawerSize}
      >
        <Drawer placement={drawerPlacement} size={drawerSize}>
          <DrawerDialog>
            <DrawerHeader>
              <DrawerTitle>
                {drawerPlacement.charAt(0).toUpperCase() +
                  drawerPlacement.slice(1)}{' '}
                Drawer ({drawerSize})
              </DrawerTitle>
              <DrawerCloseButton />
            </DrawerHeader>
            <DrawerBody>
              <p style={{ margin: '0 0 16px 0', opacity: 0.8 }}>
                This drawer is anchored to the{' '}
                <strong>{drawerPlacement}</strong> with a default desktop size
                of <strong>{drawerSize === 'md' ? '600px' : drawerSize}</strong>
                . On small screens, it automatically adapts to 100% full-width.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(128, 128, 128, 0.2)',
                      background: 'rgba(128, 128, 128, 0.05)',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      Section {i + 1}: Configuration Item
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        opacity: 0.7,
                      }}
                    >
                      Sticky header and footer remain locked while scrolling
                      body content.
                    </p>
                  </div>
                ))}
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button
                variant="secondary"
                onPress={() => setIsDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" onPress={() => setIsDrawerOpen(false)}>
                Save Changes
              </Button>
            </DrawerFooter>
          </DrawerDialog>
        </Drawer>
      </DrawerOverlay>

      {/* Basic Modal */}
      <ModalOverlay
        isOpen={isBasicModalOpen}
        onOpenChange={setIsBasicModalOpen}
      >
        <Modal>
          <ModalDialog>
            <ModalHeader>Workspace Settings</ModalHeader>
            <ModalBody>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.875rem' }}>
                Configure your project team, notification preferences, and
                analytics pipelines.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="secondary"
                onPress={() => setIsBasicModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onPress={() => setIsBasicModalOpen(false)}
              >
                Apply
              </Button>
            </ModalFooter>
          </ModalDialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}
