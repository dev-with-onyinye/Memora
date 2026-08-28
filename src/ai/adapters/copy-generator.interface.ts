import { GenerateCopyDto } from '../dto/generate-copy.dto';

export interface CopyGenerator {
  generate(dto: GenerateCopyDto): Promise<string>;
}
