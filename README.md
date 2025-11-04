# Animation Studio

**Animation Studio** is a React-based web application that allows educators and creators to design interactive canvas animations using simple drag-and-drop tools.  
Users can add shapes (circle, square, triangle, text), customize their properties (size, color, position), and animate them with smooth transitions along a timeline.

---

## Features

- **Canvas Editor**
  - Drag, move, and resize objects directly on the canvas.
  - Add geometric shapes and text elements.
  - Multi-selection support (select multiple objects at once).

- **Shape Customization**
  - Adjust size, color, and position of each shape.
  - Change text content dynamically.

- **Animation Timeline**
  - Add transitions (move, scale, rotate, color change).
  - Play, pause, and stop animations in real-time.
  - Timeline visualization of keyframes and transitions.

- **Project Management**
  - Save and load animations from local storage or backend (if connected).
  - Delete or reset current projects.

- **Responsive Interface**
  - Clean and minimal UI using Tailwind CSS.
  - Dark theme with clear layout for better workflow.

---

## Tech Stack

| Technology | Purpose |
|-------------|----------|
| **React.js** | Frontend UI framework |
| **Tailwind CSS** | Styling and layout |
| **Lucide-react** | Icons (Play, Pause, Shapes, etc.) |
| **HTML5 Canvas** | Rendering and animating objects |
| **Axios (optional)** | Backend API communication |
| **Node.js + Express (optional)** | Backend for saving/loading animations |

---

## Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/animation-studio.git
cd animation-studio

### 2. Install dependencies
npm install

### 3. Run the development server
npm run dev

### Then open your browser at:
http://localhost:5173


src/
│
├── components/
│   └── Studio/
│       └── AnimationStudio.jsx   # Main studio component
│
│
├── App.jsx                        # Entry app component
├── main.jsx                       # React root render
└── index.css                      # Tailwind CSS imports

# This project runs at Tailwind v3

Usage

Add Objects
Click the shape buttons (Circle, Square, Triangle, Text) to add them to the canvas.

Move and Customize
Drag shapes around. Click them to select and adjust color or properties.

Animate

Choose a shape.

Add a transition (move, rotate, scale, etc.).

Use Play / Pause / Stop controls to preview the animation.

Save or Reset
Use the top toolbar to save your current project or clear everything.


Future Enhancements

Timeline drag controls for keyframes

Export animations as JSON or video

Integration with backend (Express + MongoDB)

Custom easing functions for transitions

User authentication for saving projects

-- Author

Sayed Q.
Fullstack Developer & Designer

Creating interactive educational tools and creative web applications.

License
This project is licensed under the MIT License – feel free to modify and use it for your own projects.