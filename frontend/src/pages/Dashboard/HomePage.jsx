import React from "react";
import TodayOverview from "./components/TodayOverview";
import QuickUtilities from "./components/QuickUtilities";
import Announcements from "./components/Announcements";

export default function HomePage({ todayOverview = {}, announcements = [], setActiveTab }) {
    return (
        <div className="flex flex-col gap-6">
            <TodayOverview todayOverview={todayOverview} />
            <QuickUtilities setActiveTab={setActiveTab} />
            <Announcements announcements={announcements} />
        </div>
    );
}
