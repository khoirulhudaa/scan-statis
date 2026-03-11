export function Decoration(){
    return (
        <>
            {/* Background Pattern & Glow */}
            <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
            <div className="absolute inset-0 bg-grid-glow"></div>
            
            {/* Floating Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-800/20 blur-[120px] rounded-full"></div>
        </>
    )
}