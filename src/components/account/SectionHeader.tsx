export default function SectionHeader(props: { title: string; description?: string }) {
    const { title, description } = props;
    return (
        <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
        </div>
    );
}
