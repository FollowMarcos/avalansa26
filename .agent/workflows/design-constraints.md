---
description: Design Constraints for Avalansa/NewOS
---

# Design Constraints & Aesthetics

To maintain the high-end, minimal, and premium aesthetic of Avalansa (NewOS), strictly adhere to the following UI constraints in all future code additions or modifications:

## 1. Zero Visual Flourish
*   **No Drop Shadows**: Avoid `shadow-*` Tailwind classes or `box-shadow` CSS properties. Use borders and background color shifts to define depth instead.
*   **No Outer Glows**: Avoid `blur-*` classes used as glows behind elements.
*   **No Backdrop Blurs**: Avoid `backdrop-blur-*` classes. Use solid or semi-opaque background colors (alpha transparency is fine, but no blur effect).
*   **Flat Components**: Cards, buttons, and menus should be flat against the background surface, potentially separated by subtle `1px` borders.

## 2. Depth through Borders & Contrast
*   **Borders**: Use `border-primary/5` or `border-primary/10` for subtle separation.
*   **Backgrounds**: Use slight background color shifts (e.g., `bg-primary/[0.02]`) to indicate different sections or states.
*   **Ring Utility**: Use `ring-1 ring-primary/5` as an alternative to shadows for defining element boundaries.

## 3. Typography & Texture
*   **Fonts**: Continue using `font-vt323` for headlines/system markers and `font-lato` for body copy/inputs.
*   **Grain**: Always preserve the global analog grain overlay (`bg-noise`) to add organic texture without using computational blurs.

## Implementation Workflow
1. When creating a new component, check for any `shadow`, `blur`, or `backdrop-blur` classes.
2. Replace them with border-based or color-based separation.
3. Review the design to ensure it feels "tactile and flat" rather than "floating and glowing".
