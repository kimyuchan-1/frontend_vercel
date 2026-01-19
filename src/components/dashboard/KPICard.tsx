type KPICardProps = {
    title: string;
    content: string;
    caption: string;
    color: string;
}

const textColor: Record<string, string> = {
    gray : 'text-gray-500',
    red : 'text-red-600',
    green : 'text-green-600',
    blue : 'text-blue-600',
};

export default function KPICard({ title, content, caption, color}: KPICardProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border min-w-0">
            <div className="text-md font-medium text-gray-500 mb-8">
                {title}
            </div>
            <div className="text-2xl font-bold ">{content}</div>
            <div className={`text-sm  mt-1 ${textColor[color]}`}>{caption}</div>
        </div>
    )
}
