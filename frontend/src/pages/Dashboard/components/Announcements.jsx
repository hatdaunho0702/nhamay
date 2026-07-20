import React from "react";

export default function Announcements({ announcements = [] }) {
    return (
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-800">Thông báo & Tin tức</h3>
                <button className="text-xs font-semibold text-[#0f6e46] border-none bg-transparent cursor-pointer hover:underline">
                    Xem tất cả
                </button>
            </div>

            <div className="flex flex-col gap-4">
                {announcements.map((ann) => (
                    <div key={ann.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all border border-gray-50">
                        <img
                            src={ann.image}
                            alt={ann.title}
                            className="w-20 h-20 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex flex-col justify-between py-0.5">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 mb-1">{ann.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                            </div>
                            <span className="text-[10px] text-gray-400">{ann.date}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
