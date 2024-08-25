import { type FC } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { CardActionArea } from "@mui/material";

type TestsImagesCardProps = {
  imageUrl: string;
  title: string;
  onClick: () => void;
};

export const TestsImagesCard: FC<TestsImagesCardProps> = ({
  imageUrl,
  title,
  onClick,
}) => {
  return (
    <Card sx={{ width: 300 }}>
      <CardActionArea onClick={onClick}>
        <CardMedia component="img" height="250" image={imageUrl} alt={title} />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {title}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
