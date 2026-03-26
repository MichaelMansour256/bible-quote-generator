# Bible Quote Generator

A modern Arabic Bible verse image generator with beautiful typography and design.

## Features

### 🌟 Core Functionality
- **Complete Arabic Bible**: Full Smith & Van Dyck Arabic Bible API integration
- **Canonical Book Order**: Books sorted in proper biblical sequence (Genesis → Revelation)
- **Verse Selection**: Browse by book, chapter, and verse
- **Real-time Search**: Arabic text search with diacritics support
- **Image Generation**: Beautiful typography with customizable backgrounds
- **Logo Integration**: Custom SVG logo support (120px, transparent)
- **Download Support**: Save generated images locally with timestamps

### 🎨 Design Features
- **Arabic Typography**: Optimized Amiri font for beautiful Arabic text
- **Dynamic Font Sizing**: Smart sizing for long verses (20px-80px range)
- **Multiple Backgrounds**: Gradient, solid, and decorative styles
- **Custom Colors**: Text and background color customization
- **Professional Layout**: Centered text with shadows and proper spacing
- **Logo Placement**: Top-right corner, 60px from edge to avoid frame
- **Arabic References**: Proper RTL formatting with Arabic numbers and colon separator

### 🔍 Search Capabilities
- **Diacritics Support**: Works with/without Arabic tashkeel (حصن ↔ حصّن)
- **Smart Matching**: Normalized text for better search results
- **Real-time Results**: Instant search as you type
- **Clean Display**: Removes repeated words (أو/او) and extra spaces
- **Arabic References**: Proper RTL formatting (ناحوم ١: ٧)
- **Live API Data**: Searches complete Smith & Van Dyck Arabic Bible

### 📖 Bible Data
- **API Source**: Smith & Van Dyck Arabic Bible (https://api.getbible.net/v2/arabicsv.json)
- **Complete Coverage**: All 66 books, chapters, and verses
- **Live Data**: Real-time API calls with caching
- **Validation**: Verse existence verification
- **Error Handling**: Graceful fallbacks and user feedback
- **Fixed Issues**: Nahum 1:7 and all verses now accessible

### 🛠️ Technical Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Canvas API**: Dynamic image generation (1080×1080px)
- **Arabic Support**: RTL text rendering and diacritics handling
- **Responsive Design**: Mobile-friendly interface
- **Modern Architecture**: Clean, maintainable code structure

### 📁 Project Structure
```
bible-quote-generator/
├── index.html          # Main application interface
├── script.js           # Core JavaScript functionality
├── bible-api.js       # Bible API integration layer
├── styles.css          # Styling and responsive design
├── logo.svg           # Custom logo (transparent background)
└── README.md           # This documentation
```

### 🚀 Getting Started

1. **Clone/Download** the project files
2. **Add logo.svg** to the project directory (optional)
3. **Run local server**: `python -m http.server 8000`
4. **Open browser**: Navigate to `http://localhost:8000`
5. **Start generating**: Select verses and create beautiful images

### 📱 Usage Guide

#### Verse Selection
1. **Choose Book**: Select from canonical order dropdown (66 books)
2. **Choose Chapter**: Auto-populated based on book selection
3. **Pick Verse**: All available verses displayed (including Nahum 1:7)
4. **Load Verse**: Click "تحميل الآية" to load text

#### Search Function
1. **Type Arabic**: Enter search terms in Arabic
2. **Real-time Results**: See matches instantly (max 10 displayed)
3. **Click Result**: Load verse directly from search
4. **Diacritics Support**: Works with/without tashkeel

#### Image Generation
1. **Customize**: Choose background style and colors
2. **Generate**: Click "إنشاء صورة" to create image
3. **Preview**: See beautiful typography with your logo
4. **Download**: Save as PNG with timestamp

### 🎯 Key Features Explained

#### Canonical Book Order
Books displayed in proper biblical sequence:
- **Pentateuch**: تكوين → أستير
- **Historical Books**: يشوع → أستير  
- **Wisdom Literature**: أيوب → نشيد الأنشاد
- **Major Prophets**: إشعياء → ملاخي
- **Minor Prophets**: هوشع → يونان
- **Gospels**: متى → يوحنا
- **Epistles**: رومية → العبرانيين
- **Revelation**: رؤيا يوحنا

#### Arabic Typography
- **Amiri Font**: Optimized for beautiful Arabic rendering
- **Dynamic Sizing**: 80px base, scales down to 20px for long verses
- **Line Height**: 1.4x font size for optimal readability
- **Text Shadow**: Enhanced contrast and depth
- **RTL Support**: Proper right-to-left text rendering

#### Diacritics Handling
- **Smart Search**: "حصن" finds "حصّن" (Nahum 1:7)
- **Precise Removal**: Only removes fatha, damma, kasra, sukun
- **Word Preservation**: Maintains word integrity during search
- **No False Results**: Accurate matching without broken words

### 🌈 Background Styles
- **Gradient 1**: Blue-purple gradient
- **Gradient 2**: Orange-pink gradient  
- **Gradient 3**: Green-blue gradient
- **Solid Colors**: White, cream, light blue
- **Decorative**: Frame with corner decorations

### 🎨 Customization Options
- **Text Color**: Full color picker for text
- **Background Style**: Multiple preset options
- **Logo**: Custom SVG support (120px, transparent background)
- **Font Size**: Automatic based on verse length
- **Arabic Numbers**: Proper numeral formatting in references

### 🔧 Configuration

#### Logo Setup
- **File**: Place `logo.svg` in project root
- **Format**: SVG with transparent background recommended
- **Size**: Automatically scaled to 120px
- **Position**: Top-right corner, 60px from right edge

#### API Configuration
- **Endpoint**: `https://api.getbible.net/v2/arabicsv.json`
- **Caching**: Local storage for performance
- **Timeout**: 10 second request limit
- **Fallback**: Error handling with user feedback
- **Structure**: Array-based chapters and verses

### 📊 Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Canvas API**: Required for image generation
- **Arabic Rendering**: RTL text support with diacritics
- **Local Storage**: For caching and preferences

### 🐛 Troubleshooting

#### Common Issues & Solutions
- **Logo not showing**: Verify `logo.svg` exists in project directory
- **Search not working**: Check internet connection for API access
- **Verse not found**: Ensure correct book/chapter/verse selection
- **Text too small**: Long verses automatically scale for readability
- **Wrong search results**: Clear browser cache and refresh

#### Performance Tips
- **Clear Cache**: Refresh page if verses not loading
- **Check Console**: F12 for debugging information
- **API Limits**: 50 search results max, 10 displayed
- **File Size**: Generated images ~200-500KB

### 📄 License

This project is open source and available for educational and religious use.
The Arabic Bible text is from the Smith & Van Dyck public domain translation.

### 🤝 Contributing

Contributions welcome for:
- Better Arabic typography and fonts
- Additional background styles and effects
- Performance optimizations
- New Bible translations support
- Mobile app development
- Accessibility improvements

---

*Generated with ❤️ for Arabic Bible study and beautiful verse sharing*
