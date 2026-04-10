export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="container px-6 py-16 grid md:grid-cols-3 gap-10">
        {/* LEFT */}
        <div>
          <h1 className="text-white text-xl font-semibold mb-3">BlogSpace</h1>
          <p className="text-sm leading-relaxed">
            Discover clean design, dev insights, and modern web trends.
          </p>

          <div className="flex gap-4 mt-6 text-gray-500">
            <span className="hover:text-white cursor-pointer">🌐</span>
            <span className="hover:text-white cursor-pointer">🐦</span>
            <span className="hover:text-white cursor-pointer">💼</span>
          </div>
        </div>

        {/* CENTER */}
        <div>
          <h4 className="text-white font-medium mb-3">Product</h4>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Headless CMS</li>
            <li className="hover:text-white cursor-pointer">Pricing</li>
            <li className="hover:text-white cursor-pointer">GraphQL APIs</li>
          </ul>
        </div>

        {/* RIGHT */}
        <div>
          <h4 className="text-white font-medium mb-3">Company</h4>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">About</li>
            <li className="hover:text-white cursor-pointer">Careers</li>
            <li className="hover:text-white cursor-pointer">Contact</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="container text-center text-xs py-6 text-gray-500">
          © 2026 BlogSpace. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
