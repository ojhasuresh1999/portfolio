"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";

// =============================================================================
// Types
// =============================================================================

interface LightboxImage {
  src: string;
  alt: string;
}

interface LightboxState {
  isOpen: boolean;
  images: LightboxImage[];
  currentIndex: number;
}

// =============================================================================
// Constants
// =============================================================================

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.3;
const SWIPE_THRESHOLD = 50;
const ANIMATION_DURATION = 300;

// Selectors to skip — images inside these should NOT trigger lightbox
const SKIP_SELECTORS = [
  "nav",
  "header",
  "[data-lightbox-skip]",
  ".lightbox-overlay",
  "button",
  "a[href]",
];

// =============================================================================
// ImageLightbox Component
// =============================================================================

export function ImageLightbox() {
  // ── State ─────────────────────────────────────────
  const [state, setState] = useState<LightboxState>({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // ── Refs ──────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const isSwiping = useRef(false);

  // ── Open lightbox ─────────────────────────────────
  const openLightbox = useCallback(
    (images: LightboxImage[], startIndex: number) => {
      setState({ isOpen: true, images, currentIndex: startIndex });
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsAnimatingIn(true);
      setTimeout(() => setIsAnimatingIn(false), ANIMATION_DURATION);
    },
    [],
  );

  // ── Close lightbox ────────────────────────────────
  const closeLightbox = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setState({ isOpen: false, images: [], currentIndex: 0 });
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsAnimatingOut(false);
    }, ANIMATION_DURATION);
  }, []);

  // ── Navigate ──────────────────────────────────────
  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= state.images.length) return;
      setState((prev) => ({ ...prev, currentIndex: index }));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    },
    [state.images.length],
  );

  const goNext = useCallback(() => {
    if (state.currentIndex < state.images.length - 1) {
      goTo(state.currentIndex + 1);
    }
  }, [state.currentIndex, state.images.length, goTo]);

  const goPrev = useCallback(() => {
    if (state.currentIndex > 0) {
      goTo(state.currentIndex - 1);
    }
  }, [state.currentIndex, goTo]);

  // ── Zoom handlers ─────────────────────────────────
  const handleZoom = useCallback(
    (delta: number, centerX?: number, centerY?: number) => {
      setZoom((prev) => {
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));

        // When zooming out to 1, reset pan
        if (newZoom <= 1) {
          setPan({ x: 0, y: 0 });
          return 1;
        }

        // Adjust pan to zoom towards the center point
        if (
          centerX !== undefined &&
          centerY !== undefined &&
          imageRef.current
        ) {
          const rect = imageRef.current.getBoundingClientRect();
          const imgCenterX = rect.left + rect.width / 2;
          const imgCenterY = rect.top + rect.height / 2;
          const offsetX = centerX - imgCenterX;
          const offsetY = centerY - imgCenterY;
          const scale = newZoom / prev;
          setPan((p) => ({
            x: p.x - offsetX * (scale - 1),
            y: p.y - offsetY * (scale - 1),
          }));
        }

        return newZoom;
      });
    },
    [],
  );

  // ── Scroll-to-zoom (desktop) ──────────────────────
  const handleWheel = useCallback(
    (e: ReactWheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      handleZoom(delta, e.clientX, e.clientY);
    },
    [handleZoom],
  );

  // ── Mouse drag (desktop pan) ──────────────────────
  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      if (zoom <= 1) return;
      e.preventDefault();
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    },
    [zoom, pan],
  );

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent) => {
      if (!isDragging.current || zoom <= 1) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
    },
    [zoom],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Touch handlers (mobile pinch-to-zoom, pan, swipe) ──
  const handleTouchStart = useCallback(
    (e: ReactTouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch start
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance.current = Math.hypot(dx, dy);
        isSwiping.current = false;
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        touchStartTime.current = Date.now();

        if (zoom > 1) {
          // Pan start when zoomed in
          isDragging.current = true;
          dragStart.current = { x: touch.clientX, y: touch.clientY };
          panStart.current = { ...pan };
          isSwiping.current = false;
        } else {
          // Potential swipe when not zoomed
          isSwiping.current = true;
        }
      }
    },
    [zoom, pan],
  );

  const handleTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch zoom
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.hypot(dx, dy);

        if (lastTouchDistance.current > 0) {
          const scale = distance / lastTouchDistance.current;
          const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const delta = (scale - 1) * 2;
          handleZoom(delta, centerX, centerY);
        }
        lastTouchDistance.current = distance;
      } else if (e.touches.length === 1 && isDragging.current && zoom > 1) {
        // Pan when zoomed
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - dragStart.current.x;
        const dy = touch.clientY - dragStart.current.y;
        setPan({
          x: panStart.current.x + dx,
          y: panStart.current.y + dy,
        });
      }
    },
    [zoom, handleZoom],
  );

  const handleTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      if (e.touches.length === 0) {
        const endX = e.changedTouches[0]?.clientX ?? touchStartPos.current.x;
        const endY = e.changedTouches[0]?.clientY ?? touchStartPos.current.y;
        const dx = endX - touchStartPos.current.x;
        const dy = endY - touchStartPos.current.y;
        const elapsed = Date.now() - touchStartTime.current;

        if (isSwiping.current && zoom <= 1) {
          // Horizontal swipe to navigate
          if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) {
              goNext();
            } else {
              goPrev();
            }
          }
          // Quick tap outside image — close
          else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && elapsed < 300) {
            // Check if tap was on the image itself
            const target = e.target as HTMLElement;
            if (!target.closest(".lightbox-image-container")) {
              closeLightbox();
            }
          }
        }

        isDragging.current = false;
        isSwiping.current = false;
        lastTouchDistance.current = 0;
      }
    },
    [zoom, goNext, goPrev, closeLightbox],
  );

  // ── Double-tap to zoom/reset ──────────────────────
  const lastTapTime = useRef(0);
  const handleImageClick = useCallback(
    (e: ReactMouseEvent) => {
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        // Double-click/tap — toggle zoom
        if (zoom > 1) {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        } else {
          handleZoom(1.5, e.clientX, e.clientY);
        }
      }
      lastTapTime.current = now;
    },
    [zoom, handleZoom],
  );

  // ── Keyboard controls ─────────────────────────────
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "+":
        case "=":
          handleZoom(ZOOM_STEP);
          break;
        case "-":
          handleZoom(-ZOOM_STEP);
          break;
        case "0":
          setZoom(1);
          setPan({ x: 0, y: 0 });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, closeLightbox, goNext, goPrev, handleZoom]);

  // ── Lock background scroll when open ──────────────
  useEffect(() => {
    if (state.isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [state.isOpen]);

  // ── Auto-attach to page images ────────────────────
  useEffect(() => {
    /**
     * Determines if an image should be skippable
     * (inside nav, buttons, links, or explicitly excluded)
     */
    function shouldSkipImage(img: HTMLImageElement): boolean {
      // Skip tiny images (icons, avatars)
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      if (naturalW < 80 || naturalH < 80) return true;

      // Skip images with explicit data-lightbox-skip
      if (img.hasAttribute("data-lightbox-skip")) return true;

      // Skip images inside excluded containers
      for (const selector of SKIP_SELECTORS) {
        if (img.closest(selector)) return true;
      }

      return false;
    }

    /**
     * Collects all eligible images from the page and
     * attaches click handlers to open the lightbox
     */
    function attachToImages() {
      const allImages = document.querySelectorAll<HTMLImageElement>(
        "img:not([data-lightbox-attached])",
      );

      allImages.forEach((img) => {
        if (shouldSkipImage(img)) return;

        img.setAttribute("data-lightbox-attached", "true");
        img.style.cursor = "zoom-in";

        img.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Collect all lightbox-eligible images on the page for gallery nav
          const pageImages = document.querySelectorAll<HTMLImageElement>(
            "img[data-lightbox-attached]",
          );
          const images: LightboxImage[] = [];
          let clickedIndex = 0;

          pageImages.forEach((pImg, idx) => {
            // Use the highest-quality src: data-full-src > currentSrc > src
            const fullSrc =
              pImg.getAttribute("data-full-src") || pImg.currentSrc || pImg.src;
            images.push({
              src: fullSrc,
              alt: pImg.alt || "Image",
            });
            if (pImg === img) clickedIndex = idx;
          });

          openLightbox(images, clickedIndex);
        });
      });
    }

    // Initial attach
    attachToImages();

    // Re-attach when DOM changes (Next.js client-side navigation, lazy loading)
    const observer = new MutationObserver(() => {
      requestAnimationFrame(attachToImages);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [openLightbox]);

  // ── Render ────────────────────────────────────────
  if (!state.isOpen && !isAnimatingOut) return null;

  const currentImage = state.images[state.currentIndex];
  const hasMultiple = state.images.length > 1;
  const canGoPrev = state.currentIndex > 0;
  const canGoNext = state.currentIndex < state.images.length - 1;

  return createPortal(
    <div
      ref={containerRef}
      className={`lightbox-overlay ${isAnimatingIn ? "lightbox-animate-in" : ""} ${isAnimatingOut ? "lightbox-animate-out" : ""}`}
      onClick={(e) => {
        // Close when clicking backdrop (not the image or controls)
        if (
          e.target === e.currentTarget ||
          (e.target as HTMLElement).classList.contains("lightbox-backdrop")
        ) {
          closeLightbox();
        }
      }}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Backdrop */}
      <div className="lightbox-backdrop" />

      {/* Close button */}
      <button
        className="lightbox-close-btn"
        onClick={closeLightbox}
        aria-label="Close lightbox"
        title="Close (Esc)"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      {/* Image counter */}
      {hasMultiple && (
        <div className="lightbox-counter">
          {state.currentIndex + 1} / {state.images.length}
        </div>
      )}

      {/* Previous button */}
      {hasMultiple && canGoPrev && (
        <button
          className="lightbox-nav-btn lightbox-nav-prev"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Previous image"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      )}

      {/* Next button */}
      {hasMultiple && canGoNext && (
        <button
          className="lightbox-nav-btn lightbox-nav-next"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Next image"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      )}

      {/* Image container */}
      <div
        className="lightbox-image-container"
        onMouseDown={handleMouseDown}
        onClick={handleImageClick}
      >
        {currentImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imageRef}
            src={currentImage.src}
            alt={currentImage.alt}
            className="lightbox-image"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              cursor: zoom > 1 ? "grab" : "zoom-in",
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Zoom controls */}
      <div className="lightbox-zoom-controls">
        <button
          className="lightbox-zoom-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleZoom(-ZOOM_STEP);
          }}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          title="Zoom out (−)"
        >
          <span className="material-symbols-outlined">remove</span>
        </button>

        <button
          className="lightbox-zoom-btn lightbox-zoom-reset"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          aria-label="Reset zoom"
          title="Reset zoom (0)"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          className="lightbox-zoom-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleZoom(ZOOM_STEP);
          }}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          title="Zoom in (+)"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* Image dots indicator (mobile) */}
      {hasMultiple && (
        <div className="lightbox-dots">
          {state.images.map((_, idx) => (
            <button
              key={idx}
              className={`lightbox-dot ${idx === state.currentIndex ? "lightbox-dot-active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                goTo(idx);
              }}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
